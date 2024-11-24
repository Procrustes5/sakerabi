<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Loader2, MessageSquare, Edit } from 'lucide-vue-next'
import SakeReviewCard from './SakeReviewCard.vue'

const props = defineProps<{
  brandId: number
}>()

const router = useRouter()

interface Review {
  id: string
  profile: {
    id: string
    display_name: string
    avatar_url: string
  }
  event_brand: {
    id: number
    event: {
      name: string
      date: string
      location: string
    }
  }
  comment: string
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
  f1_hanayaka: number
  f2_houjun: number
  f3_juukou: number
  f4_odayaka: number
  f5_dry: number
  f6_keiikai: number
  is_liked_by_me?: boolean
}

const emit = defineEmits<{
  (e: 'addReview'): void
}>()

const reviews = ref<Review[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const error = ref<string | null>(null)
const hasUserReview = ref(false)
const currentUser = ref<string | null>(null)
const PAGE_SIZE = 10

// 評価の平均値を計算して5段階に変換
const calculateRating = (review: Review): number => {
  const values = [
    review.f1_hanayaka,
    review.f2_houjun,
    review.f3_juukou,
    review.f4_odayaka,
    review.f5_dry,
    review.f6_keiikai,
  ]
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round((avg / 100) * 5)
}

// タイムスタンプのフォーマット
const formatTimestamp = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ja })
}

// ユーザーの評価があるかチェック
const checkUserReview = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return false

    currentUser.value = userData.user.id

    const { data: eventBrandData, error: eventBrandError } = await supabase
      .from('event_brands')
      .select('id')
      .eq('brand_id', props.brandId)

    if (eventBrandError) throw eventBrandError

    if (!eventBrandData || eventBrandData.length === 0) {
      return false
    }

    const eventBrandIds = eventBrandData.map((eb) => eb.id)

    const { data, error: fetchError } = await supabase
      .from('sake_flavor_ratings')
      .select('id')
      .eq('profile_id', userData.user.id)
      .in('event_brand_id', eventBrandIds)
      .limit(1)

    if (fetchError) throw fetchError

    hasUserReview.value = data && data.length > 0
    return hasUserReview.value
  } catch (e) {
    console.error('Error checking user review:', e)
    return false
  }
}

// 初期データの取得
const fetchInitialReviews = async () => {
  try {
    isLoading.value = true
    error.value = null

    // まずユーザーの評価があるかチェック
    const hasReview = await checkUserReview()
    if (!hasReview) {
      isLoading.value = false
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    const { data, error: fetchError } = await supabase
      .from('sake_flavor_ratings')
      .select(
        `
        id,
        profile:profiles(id, display_name, avatar_url),
        event_brand:event_brands!inner(
          id,
          brand_id,
          event:events(name, date, location)
        ),
        comment,
        image_url,
        created_at,
        f1_hanayaka,
        f2_houjun,
        f3_juukou,
        f4_odayaka,
        f5_dry,
        f6_keiikai,
        likes_count,
        comments_count
      `,
      )
      .eq('event_brand.brand_id', props.brandId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (fetchError) throw fetchError

    // いいね状態の取得
    if (userData?.user && data) {
      const { data: likesData } = await supabase
        .from('sake_rating_likes')
        .select('rating_id')
        .eq('profile_id', userData.user.id)
        .in(
          'rating_id',
          data.map((review) => review.id),
        )

      const likedIds = new Set(likesData?.map((like) => like.rating_id) || [])
      data.forEach((review) => {
        review.is_liked_by_me = likedIds.has(review.id)
      })
    }

    reviews.value = data || []
    hasMore.value = data?.length === PAGE_SIZE
  } catch (e) {
    error.value = '評価の取得に失敗しました'
    console.error('Error fetching reviews:', e)
  } finally {
    isLoading.value = false
  }
}

// いいねの切り替え
const toggleLike = async (reviewId: string) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) {
      error.value = 'いいねするにはログインが必要です'
      return
    }

    const review = reviews.value.find((r) => r.id === reviewId)
    if (!review) return

    const isLiked = review.is_liked_by_me

    // Optimistic update
    review.is_liked_by_me = !isLiked
    review.likes_count += isLiked ? -1 : 1

    if (isLiked) {
      const { error: deleteError } = await supabase
        .from('sake_rating_likes')
        .delete()
        .eq('profile_id', userData.user.id)
        .eq('rating_id', reviewId)

      if (deleteError) throw deleteError
    } else {
      const { error: insertError } = await supabase.from('sake_rating_likes').insert({
        profile_id: userData.user.id,
        rating_id: reviewId,
      })

      if (insertError) throw insertError
    }
  } catch (e) {
    // Revert optimistic update on error
    const review = reviews.value.find((r) => r.id === reviewId)
    if (review) {
      review.is_liked_by_me = !review.is_liked_by_me
      review.likes_count += review.is_liked_by_me ? 1 : -1
    }
    error.value = 'いいねの処理に失敗しました'
    console.error('Error toggling like:', e)
  }
}

// Intersection Observer for infinite scroll
const observeLastElement = (entries: IntersectionObserverEntry[]) => {
  const lastEntry = entries[entries.length - 1]
  if (lastEntry.isIntersecting) {
    loadMore()
  }
}

// 追加データの取得
const loadMore = async () => {
  if (isLoading.value || !hasMore.value) return

  try {
    isLoading.value = true
    const lastReview = reviews.value[reviews.value.length - 1]

    const { data: userData } = await supabase.auth.getUser()

    const { data, error: fetchError } = await supabase
      .from('sake_flavor_ratings')
      .select(
        `
        id,
        profile:profiles(id, display_name, avatar_url),
        event_brand:event_brands!inner(
          id,
          brand_id,
          event:events(name, date, location)
        ),
        comment,
        image_url,
        created_at,
        f1_hanayaka,
        f2_houjun,
        f3_juukou,
        f4_odayaka,
        f5_dry,
        f6_keiikai,
        likes_count,
        comments_count
      `,
      )
      .eq('event_brand.brand_id', props.brandId)
      .order('created_at', { ascending: false })
      .lt('created_at', lastReview.created_at)
      .limit(PAGE_SIZE)

    if (fetchError) throw fetchError

    // いいね状態の取得
    if (userData?.user && data) {
      const { data: likesData } = await supabase
        .from('sake_rating_likes')
        .select('rating_id')
        .eq('profile_id', userData.user.id)
        .in(
          'rating_id',
          data.map((review) => review.id),
        )

      const likedIds = new Set(likesData?.map((like) => like.rating_id) || [])
      data.forEach((review) => {
        review.is_liked_by_me = likedIds.has(review.id)
      })
    }

    reviews.value.push(...(data || []))
    hasMore.value = data?.length === PAGE_SIZE
  } catch (e) {
    error.value = 'データの読み込みに失敗しました'
    console.error('Error loading more reviews:', e)
  } finally {
    isLoading.value = false
  }
}

// 評価ボタンクリック時の処理を変更
const handleAddReview = () => {
  emit('addReview')
}

onMounted(() => {
  fetchInitialReviews()

  // Intersection Observerの設定
  const observer = new IntersectionObserver(observeLastElement, {
    root: null,
    rootMargin: '100px',
    threshold: 0.1,
  })

  nextTick(() => {
    const lastElement = document.querySelector('.review-card:last-child')
    if (lastElement) observer.observe(lastElement)
  })
})

defineExpose({
  refresh: fetchInitialReviews,
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-gray-600" />
          <h2 class="text-lg font-medium text-gray-900">みんなの評価</h2>
        </div>
        <!-- ログイン済みかつ評価していない場合は評価ボタンを表示 -->
        <button
          v-if="currentUser"
          @click="handleAddReview"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <Edit class="w-4 h-4" />
          <span>評価する</span>
        </button>
      </div>

      <!-- 評価がない場合のメッセージ -->
      <div v-if="!hasUserReview" class="text-center py-8">
        <p class="text-gray-500 mb-2">まだこの日本酒の評価をしていません</p>
        <p class="text-sm text-gray-400">
          他のユーザーの評価を見るには、まずあなたの評価を投稿してください
        </p>
      </div>

      <!-- エラー表示 -->
      <div v-else-if="error" class="px-4 py-2 bg-red-100 text-red-700 rounded-md mb-4">
        {{ error }}
      </div>

      <!-- レビューリスト -->
      <div v-else class="space-y-4">
        <template v-if="reviews.length > 0">
          <SakeReviewCard
            v-for="(review, index) in reviews"
            :key="review.id"
            :review="{
              id: review.id,
              userImage: review.profile.avatar_url,
              userName: review.profile.display_name,
              timestamp: formatTimestamp(review.created_at),
              rating: calculateRating(review),
              content: review.comment,
              image: review.image_url,
              likes: review.likes_count,
              comments: review.comments_count,
              isLiked: review.is_liked_by_me,
              event: review.event_brand.event
                ? {
                    name: review.event_brand.event.name,
                    date: review.event_brand.event.date,
                    location: review.event_brand.event.location,
                  }
                : null,
            }"
            class="review-card"
            :class="{ 'last-review': index === reviews.length - 1 }"
            @toggle-like="toggleLike(review.id)"
          />
        </template>

        <!-- 空の状態 -->
        <div v-else-if="!isLoading" class="text-center py-8 text-gray-500">
          まだ評価がありません
        </div>
      </div>

      <!-- ローディングインジケーター -->
      <div v-if="isLoading" class="flex justify-center items-center py-4">
        <Loader2 class="w-6 h-6 text-gray-600 animate-spin" />
      </div>

      <!-- さらに読み込むボタン -->
      <div v-if="hasMore && !isLoading && reviews.length > 0" class="flex justify-center mt-4">
        <button
          @click="loadMore"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          さらに読み込む
        </button>
      </div>
    </div>
  </div>
</template>
