<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { Calendar, MapPin, Plus, Pencil, Search } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import AppHeader from '@/components/AppHeader.vue'

interface Event {
  id: number
  name: string
  date: string
  location: string
  description: string
  created_at: string
}

interface Brand {
  id: number
  name: string
  brewery: {
    name: string
  }
}

interface EventBrand {
  id: number
  event_id: number
  brand_id: number
  brand: Brand
}

const route = useRoute()
const router = useRouter()
const eventId = Number(route.params.id)

const event = ref<Event | null>(null)
const eventBrands = ref<EventBrand[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const showAddSakeModal = ref(false)
const searchQuery = ref('')
const searchResults = ref<Brand[]>([])
const isSearching = ref(false)

// イベント情報の取得
const fetchEventDetails = async () => {
  isLoading.value = true
  loadError.value = null

  try {
    // イベント情報の取得
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) throw eventError
    event.value = eventData

    // イベントに関連付けられた日本酒の取得
    const { data: brandsData, error: brandsError } = await supabase
      .from('event_brands')
      .select(`
        id,
        brand_id,
        brand:brands (
          id,
          name,
          brewery:breweries (
            name
          )
        )
      `)
      .eq('event_id', eventId)

    if (brandsError) throw brandsError
    eventBrands.value = brandsData

  } catch (error) {
    loadError.value = 'イベント情報の取得に失敗しました。'
    console.error('Error fetching event details:', error)
  } finally {
    isLoading.value = false
  }
}

// 日本酒の検索
const searchSake = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        brewery:breweries (
          name
        )
      `)
      .ilike('name', `%${searchQuery.value}%`)
      .limit(10)

    if (error) throw error
    searchResults.value = data
  } catch (error) {
    console.error('Error searching sake:', error)
  } finally {
    isSearching.value = false
  }
}

// イベントに日本酒を追加
const addSakeToEvent = async (brandId: number) => {
  try {
    const { error } = await supabase
      .from('event_brands')
      .insert({
        event_id: eventId,
        brand_id: brandId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    // 成功したら再読み込み
    await fetchEventDetails()
    showAddSakeModal.value = false
    searchQuery.value = ''
    searchResults.value = []
  } catch (error) {
    console.error('Error adding sake to event:', error)
  }
}

// 日本酒の削除
const removeSakeFromEvent = async (eventBrandId: number) => {
  try {
    const { error } = await supabase
      .from('event_brands')
      .delete()
      .eq('id', eventBrandId)

    if (error) throw error
    await fetchEventDetails()
  } catch (error) {
    console.error('Error removing sake from event:', error)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

onMounted(() => {
  fetchEventDetails()
})
</script>

<template>
  <div class="max-w-3xl mx-auto bg-gray-50 min-h-screen">
    <AppHeader />

    <LoadingSpinner v-if="isLoading" />

    <ErrorDisplay
      v-else-if="loadError"
      :message="loadError"
      :onRetry="fetchEventDetails"
    />

    <template v-else-if="event">
      <div class="p-4">
        <!-- イベント情報 -->
        <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div class="flex justify-between items-start mb-4">
            <h1 class="text-2xl font-bold text-gray-900">{{ event.name }}</h1>
            <button
              @click="router.push(`/events/${event.id}/edit`)"
              class="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Pencil class="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-gray-600">
              <Calendar class="w-5 h-5" />
              <span>{{ formatDate(event.date) }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <MapPin class="w-5 h-5" />
              <span>{{ event.location }}</span>
            </div>
          </div>

          <p class="text-gray-600">{{ event.description }}</p>
        </div>

        <!-- 日本酒リスト -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900">提供される日本酒</h2>
            <button
              @click="showAddSakeModal = true"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors"
            >
              <Plus class="w-5 h-5" />
              <span>日本酒を追加</span>
            </button>
          </div>

          <div v-if="eventBrands.length === 0" class="text-center py-8">
            <p class="text-gray-500">まだ日本酒が登録されていません</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="eventBrand in eventBrands"
              :key="eventBrand.id"
              class="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h3 class="font-medium text-gray-900">{{ eventBrand.brand.name }}</h3>
                <p class="text-sm text-gray-600">{{ eventBrand.brand.brewery.name }}</p>
              </div>
              <button
                @click="removeSakeFromEvent(eventBrand.id)"
                class="text-sm text-red-600 hover:text-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 日本酒追加モーダル -->
      <div
        v-if="showAddSakeModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        @click.self="showAddSakeModal = false"
      >
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-bold text-gray-900 mb-4">日本酒を追加</h3>

          <div class="relative mb-4">
            <input
              v-model="searchQuery"
              @input="searchSake"
              type="text"
              placeholder="日本酒を検索..."
              class="w-full p-2 pr-10 border rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search class="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
          </div>

          <div v-if="isSearching" class="text-center py-4">
            <LoadingSpinner />
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
            <button
              v-for="brand in searchResults"
              :key="brand.id"
              @click="addSakeToEvent(brand.id)"
              class="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div class="font-medium text-gray-900">{{ brand.name }}</div>
              <div class="text-sm text-gray-600">{{ brand.brewery.name }}</div>
            </button>
          </div>

          <div v-else-if="searchQuery" class="text-center py-4">
            <p class="text-gray-500">検索結果がありません</p>
          </div>

          <div class="mt-4 flex justify-end">
            <button
              @click="showAddSakeModal = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
