<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { Search, ArrowLeft, Store, MapPin } from 'lucide-vue-next'
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
let observer: IntersectionObserver | null = null

// データ取得中かどうかのフラグ
const isFetching = ref(false)

// 監視の設定と開始
const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    async (entries) => {
      const target = entries[0]
      if (target.isIntersecting && !isFetching.value && hasMore.value && !searchQuery.value.trim()) {
        await loadMore()
      }
    },
    {
      rootMargin: '200px',
      threshold: 0
    }
  )

  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
}

// 監視の開始
onMounted(async () => {
  await fetchInitialSakeList()
  await nextTick(() => {
    setupObserver()
  })
})

// 監視の終了
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// 検索クエリの監視
watch(searchQuery, async (newQuery) => {
  if (newQuery.trim()) {
    await handleSearch()
    if (observer) {
      observer.disconnect()
    }
  } else {
    await fetchInitialSakeList()
    await nextTick(() => {
      setupObserver()
    })
  }
})

// 初期データの取得
const fetchInitialSakeList = async () => {
  if (isFetching.value) return

  try {
    isFetching.value = true
    isLoading.value = true
    errorMessage.value = ''
    page.value = 0
    sakeList.value = []

    const { data, error } = await supabase
      .from('brands')
      .select(
        `
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
      `,
      )
      .order('name', { ascending: true })
      .range(0, PER_PAGE - 1)

    if (error) throw error

    sakeList.value = data || []
    hasMore.value = data.length === PER_PAGE
    page.value = 1

    await nextTick(() => {
      setupObserver()
    })
  } catch (error) {
    console.error('Fetch error:', error)
    errorMessage.value = 'データの取得中にエラーが発生しました'
  } finally {
    isLoading.value = false
    isFetching.value = false
  }
}

// 追加データの読み込み
const loadMore = async () => {
  if (isFetching.value || !hasMore.value || searchQuery.value.trim()) return

  try {
    isFetching.value = true
    isLoading.value = true
    const start = page.value * PER_PAGE
    const end = start + PER_PAGE - 1

    const { data, error } = await supabase
      .from('brands')
      .select(
        `
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
      `,
      )
      .order('name', { ascending: true })
      .range(start, end)

    if (error) throw error

    if (data) {
      const existingIds = new Set(sakeList.value.map(item => item.id))
      const newItems = data.filter(item => !existingIds.has(item.id))

      if (newItems.length > 0) {
        sakeList.value = [...sakeList.value, ...newItems]
        page.value++
      }

      hasMore.value = data.length === PER_PAGE

      await nextTick(() => {
        setupObserver()
      })
    }
  } catch (error) {
    console.error('Load more error:', error)
    errorMessage.value = '追加データの取得中にエラーが発生しました'
  } finally {
    isLoading.value = false
    isFetching.value = false
  }
}

// 検索処理
const handleSearch = async () => {
  if (isFetching.value) return

  try {
    isFetching.value = true
    isLoading.value = true
    errorMessage.value = ''

    const query = supabase
      .from('brands')
      .select(
        `
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
      `,
      )
      .limit(50)

    if (searchQuery.value.trim()) {
      query.ilike('name', `%${searchQuery.value}%`)
    } else {
      query.order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) throw error

    sakeList.value = data || []
    hasMore.value = !searchQuery.value.trim()
    page.value = 1

    if (!searchQuery.value.trim()) {
      await nextTick(() => {
        setupObserver()
      })
    }
  } catch (error) {
    console.error('Search error:', error)
    errorMessage.value = '検索中にエラーが発生しました'
  } finally {
    isLoading.value = false
    isFetching.value = false
  }
}

const navigateToDetail = (sake: SakeItem) => {
  router.push(`/sake/${sake.id}`)
}

const handleBack = () => {
  router.back()
}

const handlePaste = async (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text')
  if (pastedText) {
    searchQuery.value = pastedText
    await handleSearch()
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto bg-gray-50 min-h-screen pb-8">
    <AppHeader />

    <!-- ヘッダー部分 -->
    <div class="flex items-center mb-6 px-4 space-x-4">
      <button @click="handleBack" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">日本酒リスト</h1>
    </div>

    <!-- 検索欄 -->
    <div class="px-4 mb-6">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="日本酒を検索..."
          class="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500 bg-white"
          @input="handleSearch"
          @paste="handlePaste"
          @keyup.enter="handleSearch"
        />
        <Search class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>
    </div>

    <!-- エラーメッセージ -->
    <ErrorDisplay v-if="errorMessage" :message="errorMessage" :onRetry="fetchInitialSakeList" />

    <!-- 検索結果なし -->
    <div v-else-if="sakeList.length === 0" class="text-center py-8 text-gray-600">
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
            <h2 class="text-xl font-semibold text-gray-900 mb-3">
              {{ sake.name }}
            </h2>
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
        v-if="hasMore && !searchQuery.trim()"
        ref="observerTarget"
        class="mt-12 h-20 flex items-center justify-center"
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
