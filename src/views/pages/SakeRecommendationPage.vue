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
const searchQuery = ref('')
const sakeList = ref<SakeItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const hasMore = ref(true)
const page = ref(0)
const PER_PAGE = 20

// スクロール検知の設定
const observerTarget = ref<HTMLElement | null>(null)
const observer = new IntersectionObserver(
  (entries) => {
    const first = entries[0]
    if (first.isIntersecting) {
      loadMore()
    }
  },
  { threshold: 0.5 }
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

    const { data, error } = await supabase
      .from('random_brands')
      .select(`
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
      `)
      .range(0, PER_PAGE - 1)

    if (error) throw error
    sakeList.value = data || []
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
  if (!hasMore.value || isLoading.value || searchQuery.value.trim()) return

  try {
    isLoading.value = true
    const start = page.value * PER_PAGE
    const end = start + PER_PAGE - 1

    const { data, error } = await supabase
      .from('random_brands')
      .select(`
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
      `)
      .order('name', { ascending: true })
      .range(start, end)

    if (error) throw error

    if (data) {
      sakeList.value = [...sakeList.value, ...data]
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
  <div class="max-w-3xl mx-auto bg-gray-50 min-h-screen pb-8">
    <AppHeader />

    <!-- ヘッダー部分 -->
    <div class="flex items-center mb-6 px-4 space-x-4">
      <button
        @click="handleBack"
        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">おすすめ</h1>
    </div>

    <!-- エラーメッセージ -->
    <ErrorDisplay
      v-if="errorMessage"
      :message="errorMessage"
      :onRetry="fetchInitialSakeList"
    />

    <!-- 検索結果なし -->
    <div
      v-else-if="sakeList.length === 0"
      class="text-center py-8 text-gray-600"
    >
      日本酒が見つかりませんでした
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
      <div
        v-if="hasMore && !searchQuery"
        ref="observerTarget"
        class="h-20 flex items-center justify-center"
      >
        <LoadingSpinner v-if="isLoading" />
      </div>
    </div>
  </div>
</template>

<style scoped>
input {
  font-size: 16px !important;
  -webkit-text-size-adjust: 100%;
}
</style>
