<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { ArrowLeft, Store, MapPin } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import AppHeader from '@/components/AppHeader.vue'

interface SakeItem {
  id: number
  name: string
  brewery: {
    id: number
    name: string
    area: {
      id: number
      name: string
    }
  }
}

const router = useRouter()
const sakeList = ref<SakeItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const hasMore = ref(true)
const page = ref(0)
const PER_PAGE = 20

// プロフィール情報を取得
const getCurrentProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

// スクロール検知の設定
const observerTarget = ref<HTMLElement | null>(null)
const observer = new IntersectionObserver(
  (entries) => {
    const first = entries[0]
    if (first.isIntersecting) {
      loadMore()
    }
  },
  { threshold: 0.5 },
)

// 監視の開始と終了
onMounted(() => {
  fetchInitialSakeList()
})

const startObserver = () => {
  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
}

const stopObserver = () => {
  observer.disconnect()
}

// 初期データの取得
const fetchInitialSakeList = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    page.value = 0
    sakeList.value = []
    hasMore.value = true

    const profile = await getCurrentProfile()
    if (!profile) {
      errorMessage.value = 'プロフィール情報の取得に失敗しました'
      return
    }

    const { data, error } = await supabase
      .from('favorite_brands')
      .select(
        `
        brand:brand_id (
          id,
          name,
          brewery:brewery_id (
            id,
            name,
            area:area_id (
              id,
              name
            )
          )
        )
      `,
      )
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(0, PER_PAGE - 1)

    if (error) throw error

    // データを整形
    sakeList.value =
      data?.map((item) => ({
        id: item.brand.id,
        name: item.brand.name,
        brewery: item.brand.brewery,
      })) || []

    hasMore.value = data.length === PER_PAGE
    page.value = 1

    // 監視を開始
    startObserver()
  } catch (error) {
    console.error('Fetch error:', error)
    errorMessage.value = 'データの取得中にエラーが発生しました'
  } finally {
    isLoading.value = false
  }
}

// 追加データの読み込み
const loadMore = async () => {
  if (!hasMore.value || isLoading.value) return

  try {
    isLoading.value = true
    const start = page.value * PER_PAGE
    const end = start + PER_PAGE - 1

    const profile = await getCurrentProfile()
    if (!profile) {
      errorMessage.value = 'プロフィール情報の取得に失敗しました'
      return
    }

    const { data, error } = await supabase
      .from('favorite_brands')
      .select(
        `
        brand:brand_id (
          id,
          name,
          brewery:brewery_id (
            id,
            name,
            area:area_id (
              id,
              name
            )
          )
        )
      `,
      )
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(start, end)

    if (error) throw error

    if (data) {
      // データを整形
      const newItems = data.map((item) => ({
        id: item.brand.id,
        name: item.brand.name,
        brewery: item.brand.brewery,
      }))

      sakeList.value = [...sakeList.value, ...newItems]
      hasMore.value = data.length === PER_PAGE
      page.value++
    }
  } catch (error) {
    console.error('Load more error:', error)
    errorMessage.value = '追加データの取得中にエラーが発生しました'
  } finally {
    isLoading.value = false
  }
}

// 詳細ページへの遷移
const navigateToDetail = (sake: SakeItem) => {
  router.push(`/sake/${sake.id}`)
}

const handleBack = () => {
  router.back()
}
</script>

<template>
  <div class="mx-auto bg-gray-50 min-h-screen pb-8">
    <AppHeader />

    <!-- ヘッダー部分 -->
    <div class="flex items-center mb-6 px-4 space-x-4">
      <button @click="handleBack" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">お気に入り</h1>
    </div>

    <!-- エラーメッセージ -->
    <ErrorDisplay v-if="errorMessage" :message="errorMessage" :onRetry="fetchInitialSakeList" />

    <!-- 検索結果なし -->
    <div v-else-if="sakeList.length === 0" class="text-center py-8 text-gray-600">
      <LoadingSpinner v-if="isLoading" />
      <template v-else>日本酒が見つかりませんでした</template>
    </div>

    <!-- 日本酒リスト -->
    <div v-else class="space-y-4 px-4">
      <div
        v-for="sake in sakeList"
        :key="sake.id"
        class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
        @click="navigateToDetail(sake)"
      >
        <div class="flex items-start space-x-4">
          <div class="flex-grow">
            <!-- 日本酒名 -->
            <h2 class="text-xl font-semibold text-gray-900 mb-3">
              {{ sake.name }}
            </h2>

            <!-- 酒蔵情報 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-gray-600">
                <Store class="w-5 h-5" />
                <span>{{ sake.brewery?.name }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <MapPin class="w-5 h-5" />
                <span>{{ sake.brewery?.area?.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Intersection Observer のターゲット要素 -->
      <div v-if="hasMore" ref="observerTarget" class="h-20 flex items-center justify-center">
        <LoadingSpinner v-if="isLoading" />
      </div>
    </div>
  </div>
</template>
