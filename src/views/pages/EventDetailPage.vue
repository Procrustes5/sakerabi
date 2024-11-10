<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { Calendar, MapPin, Plus, Pencil, Camera } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import AppHeader from '@/components/AppHeader.vue'
import SakeRatingModal from '@/components/SakeRatingModal.vue'
import SakeAddModal from '@/components/SakeAddModal.vue'
import FlavorRating from '@/components/FlavorRating.vue'

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

interface FlavorRating {
  id: number
  profile_id: string
  f1_hanayaka: number
  f2_houjun: number
  f3_juukou: number
  f4_odayaka: number
  f5_dry: number
  f6_keiikai: number
  comment: string
  image_url: string | null
  profile: {
    display_name: string
  }
}

interface EventBrand {
  id: number
  event_id: number
  brand_id: number
  brand: Brand
  flavor_ratings?: FlavorRating[]
  average_ratings?: {
    f1_hanayaka: number
    f2_houjun: number
    f3_juukou: number
    f4_odayaka: number
    f5_dry: number
    f6_keiikai: number
  }
}

const route = useRoute()
const router = useRouter()
const eventId = Number(route.params.id)

const event = ref<Event | null>(null)
const eventBrands = ref<EventBrand[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const showAddSakeModal = ref(false)
const showRatingModal = ref(false)
const selectedEventBrand = ref<EventBrand | null>(null)

// イベント情報とレーティングの取得
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

    // イベントに関連付けられた日本酒と評価情報を取得
    const { data: brandsData, error: brandsError } = await supabase
      .from('event_brands')
      .select(
        `
        id,
        brand_id,
        brand:brands (
          id,
          name,
          brewery:breweries (
            name
          )
        ),
        flavor_ratings:sake_flavor_ratings (
          id,
          profile_id,
          f1_hanayaka,
          f2_houjun,
          f3_juukou,
          f4_odayaka,
          f5_dry,
          f6_keiikai,
          comment,
          image_url,
          profile:profiles (
            display_name
          )
        )
      `,
      )
      .eq('event_id', eventId)

    if (brandsError) throw brandsError

    // 平均評価を計算
    eventBrands.value = brandsData.map((brand) => {
      const ratings = brand.flavor_ratings || []
      const average_ratings =
        ratings.length > 0
          ? {
              f1_hanayaka: ratings.reduce((sum, r) => sum + r.f1_hanayaka, 0) / ratings.length,
              f2_houjun: ratings.reduce((sum, r) => sum + r.f2_houjun, 0) / ratings.length,
              f3_juukou: ratings.reduce((sum, r) => sum + r.f3_juukou, 0) / ratings.length,
              f4_odayaka: ratings.reduce((sum, r) => sum + r.f4_odayaka, 0) / ratings.length,
              f5_dry: ratings.reduce((sum, r) => sum + r.f5_dry, 0) / ratings.length,
              f6_keiikai: ratings.reduce((sum, r) => sum + r.f6_keiikai, 0) / ratings.length,
            }
          : undefined

      return {
        ...brand,
        average_ratings,
      }
    })
  } catch (error) {
    loadError.value = 'イベント情報の取得に失敗しました。'
    console.error('Error fetching event details:', error)
  } finally {
    isLoading.value = false
  }
}

// 日本酒の削除
const removeSakeFromEvent = async (eventBrandId: number) => {
  try {
    const { error } = await supabase.from('event_brands').delete().eq('id', eventBrandId)

    if (error) throw error
    await fetchEventDetails()
  } catch (error) {
    console.error('Error removing sake from event:', error)
  }
}

// 評価モーダルを開く
const openRatingModal = (eventBrand: EventBrand) => {
  selectedEventBrand.value = eventBrand
  showRatingModal.value = true
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

    <ErrorDisplay v-else-if="loadError" :message="loadError" :onRetry="fetchEventDetails" />

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
              <span>追加</span>
            </button>
          </div>

          <div v-if="eventBrands.length === 0" class="text-center py-8">
            <p class="text-gray-500">まだ日本酒が登録されていません</p>
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="eventBrand in eventBrands"
              :key="eventBrand.id"
              class="bg-gray-50 rounded-xl p-6"
            >
              <!-- 日本酒情報 -->
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ eventBrand.brand.name }}
                  </h3>
                  <p class="text-sm text-gray-600">
                    {{ eventBrand.brand.brewery.name }}
                  </p>
                </div>
                <div class="flex items-center gap-3">
                  <button
                    @click="openRatingModal(eventBrand)"
                    class="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
                  >
                    評価する
                  </button>
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
        </div>
      </div>

      <!-- 評価モーダル -->
      <SakeRatingModal
        v-if="selectedEventBrand"
        :is-open="showRatingModal"
        :event-brand-id="selectedEventBrand.id"
        :brand-name="selectedEventBrand.brand.name"
        :brewery-name="selectedEventBrand.brand.brewery.name"
        @close="showRatingModal = false"
        @submit="fetchEventDetails"
      />
      <!-- 日本酒追加モーダル -->
      <SakeAddModal
        :is-open="showAddSakeModal"
        :event-id="eventId"
        @close="showAddSakeModal = false"
        @add="fetchEventDetails"
      />
    </template>
  </div>
</template>
