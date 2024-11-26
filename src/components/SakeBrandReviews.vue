<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Loader2, MessageSquare, Edit, Users } from 'lucide-vue-next'
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
    brandId: string
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

interface ReviewerStats {
  total: number
  recent: Review[]
}

const emit = defineEmits<{
  (e: 'addReview'): void
}>()

const reviews = ref<Review[]>([])
const reviewerStats = ref<ReviewerStats>({
  total: 0,
  recent: []
})
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

// レビュアー統計の取得
const fetchReviewerStats = async () => {
  try {
    const { data: eventBrandData } = await supabase
      .from('event_brands')
      .select('id')
      .eq('brand_id', props.brandId)

    if (!eventBrandData) return

    const eventBrandIds = eventBrandData.map((eb) => eb.id)

    // 総評価数の取得
    const { count } = await supabase
      .from('sake_flavor_ratings')
      .select('id', { count: 'exact' })
      .in('event_brand_id', eventBrandIds)

    // 最近の評価者の取得（最大3人）
    const { data: recentReviews } = await supabase
      .from('sake_flavor_ratings')
      .select(`
        profile:profiles(id, display_name, avatar_url),
        created_at
      `)
      .in('event_brand_id', eventBrandIds)
      .order('created_at', { ascending: false })
      .limit(3)

    reviewerStats.value = {
      total: count || 0,
      recent: recentReviews || []
    }
  } catch (e) {
    console.error('Error fetching reviewer stats:', e)
  }
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

    // ユーザーの評価がない場合は、レビュアー統計を取得
    if (!hasUserReview.value) {
      await fetchReviewerStats()
    }

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
      const { error: insertError } = await supabase
        .from('sake_rating_likes')
        .insert({
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

// レビュー削除時のハンドラー
const handleReviewDelete = async (reviewId: string) => {
  try {
    const { error: deleteError } = await supabase
      .from('sake_flavor_ratings')
      .delete()
      .eq('id', reviewId)

    if (deleteError) throw deleteError

    // 画面をリロード
    await fetchInitialReviews()
    await checkUserReview() // ユーザーの評価状態を再チェック
  } catch (e) {
    error.value = '評価の削除に失敗しました'
    console.error('Error deleting review:', e)
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

// Intersection Observer for infinite scroll
const observeLastElement = (entries: IntersectionObserverEntry[]) => {
  const lastEntry = entries[entries.length - 1]
  if (lastEntry.isIntersecting) {
    loadMore()
  }
}

// 評価ボタンクリック時の処理
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
      <!-- ヘッダー部分 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-gray-600" />
          <h2 class="text-lg font-medium text-gray-900">みんなの評価</h2>
        </div>
        <!-- ログイン済みかつ評価していない場合は評価ボタンを表示 -->
        <button
          v-if="currentUser && !hasUserReview"
          @click="handleAddReview"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors"
        >
          <Edit class="w-4 h-4" />
          <span>評価する</span>
        </button>
      </div>

      <!-- 評価がない場合のメッセージ -->
      <div v-if="!hasUserReview" class="space-y-6">
        <!-- レビュアー統計情報 -->
        <div v-if="reviewerStats.total > 0" class="bg-gray-50 rounded-xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <Users class="w-5 h-5 text-gray-600" />
            <h3 class="font-medium text-gray-900">
              {{ reviewerStats.total }}人が評価済み
            </h3>
          </div>

          <!-- 最近の評価者アバター -->
          <div class="flex flex-col gap-4">
            <!-- アバター表示部分 -->
            <div class="flex items-center -space-x-2">
              <div
                v-for="reviewer in reviewerStats.recent"
                :key="reviewer.profile.id"
                class="relative"
              >
                <img
                  :src="reviewer.profile.avatar_url || '/default-avatar.png'"
                  :alt="reviewer.profile.display_name"
                  class="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </div>

            <!-- アクションメッセージ -->
            <div class="space-y-2">
              <p class="text-gray-600">
                他のユーザーの評価を見るには、まずあなたの評価を投稿してください。
              </p>
            </div>
          </div>
        </div>

        <!-- 評価がない場合のメッセージ -->
        <div v-else class="text-center py-8 bg-gray-50 rounded-xl">
          <p class="text-gray-600 mb-2">まだこの日本酒の評価はありません</p>
          <p class="text-sm text-gray-500 mb-4">
            最初の評価を投稿して、他のユーザーと感想を共有しましょう
          </p>
          <button
            v-if="currentUser"
            @click="handleAddReview"
            class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit class="w-4 h-4" />
            最初の評価を投稿する
          </button>
        </div>
      </div>

      <!-- エラー表示 -->
      <div
        v-if="error"
        class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <p class="text-red-600">{{ error }}</p>
      </div>

      <!-- レビューリスト -->
      <div v-if="hasUserReview" class="space-y-4">
        <template v-if="reviews.length > 0">
          <SakeReviewCard
            v-for="(review, index) in reviews"
            :key="review.id"
            :review="{
              id: review.id,
              userImage: review.profile.avatar_url,
              userName: review.profile.display_name,
              timestamp: formatTimestamp(review.created_at),
              sakeId: review.event_brand.brandId,
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
              profileId: review.profile.id,
            }"
            :is-owner="review.profile.id === currentUser"
            class="review-card transition-all duration-200 hover:shadow-md"
            :class="{
              'last-review': index === reviews.length - 1,
              'border border-gray-100 rounded-xl': true
            }"
            @toggle-like="toggleLike(review.id)"
            @delete="handleReviewDelete(review.id)"
          />
        </template>

        <!-- 空の状態 -->
        <div
          v-else-if="!isLoading"
          class="text-center py-8 bg-gray-50 rounded-xl"
        >
          <p class="text-gray-500">まだ評価がありません</p>
        </div>
      </div>

      <!-- ローディングインジケーター -->
      <div
        v-if="isLoading"
        class="flex justify-center items-center py-6"
      >
        <div class="flex items-center gap-2">
          <Loader2 class="w-5 h-5 text-gray-600 animate-spin" />
          <span class="text-gray-600">読み込み中...</span>
        </div>
      </div>

      <!-- さらに読み込むボタン -->
      <div
        v-if="hasMore && !isLoading && reviews.length > 0"
        class="flex justify-center mt-6"
      >
        <button
          @click="loadMore"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span>さらに読み込む</span>
          <Loader2
            v-if="isLoading"
            class="w-4 h-4 animate-spin"
          />
        </button>
      </div>

      <!-- ページネーション情報 -->
      <div
        v-if="reviews.length > 0"
        class="mt-4 text-center text-sm text-gray-500"
      >
        {{ reviews.length }}件を表示中
      </div>
    </div>
  </div>
</template>
