<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { Plus, Calendar, MapPin, Pencil } from 'lucide-vue-next'
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
  _count?: {
    brands: number
  }
}

const router = useRouter()
const events = ref<Event[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const fetchEvents = async () => {
  isLoading.value = true
  loadError.value = null

  try {
    // イベント情報と、各イベントに紐づく日本酒の数を取得
    const { data, error } = await supabase.from('events').select(`
        *,
        event_brands:event_brands (
          count
        )
      `)

    if (error) throw error

    // event_brandsの数を_countプロパティに変換
    events.value = data.map((event) => ({
      ...event,
      _count: {
        brands: event.event_brands[0]?.count || 0,
      },
    }))
  } catch (error) {
    loadError.value = '開催予定のイベント情報の取得に失敗しました。'
    console.error('Error fetching events:', error)
  } finally {
    isLoading.value = false
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

const navigateToCreate = () => {
  router.push('/events/create')
}

const navigateToEdit = (eventId: number, event: Event) => {
  event.stopPropagation() // カードのクリックイベントが発火するのを防ぐ
  router.push(`/events/${eventId}/edit`)
}

const navigateToDetail = (eventId: number) => {
  router.push(`/events/${eventId}`)
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div class="max-w-3xl mx-auto bg-gray-50 min-h-screen">
    <AppHeader />

    <!-- ヘッダー部分 -->
    <div class="flex justify-between items-center mb-6 px-4">
      <h1 class="text-2xl font-bold text-gray-900">開催予定のイベント</h1>
      <button
        @click="navigateToCreate"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors"
      >
        <Plus class="w-5 h-5" />
        <span>作成</span>
      </button>
    </div>

    <!-- ローディング状態 -->
    <LoadingSpinner v-if="isLoading" />

    <!-- エラー表示 -->
    <ErrorDisplay v-else-if="loadError" :message="loadError" :onRetry="fetchEvents" />

    <!-- イベントが存在しない場合 -->
    <div v-else-if="events.length === 0" class="text-center py-12">
      <p class="text-gray-500">開催予定のイベントはありません</p>
    </div>

    <!-- イベントリスト -->
    <div v-else class="space-y-4 px-4">
      <div
        v-for="event in events"
        :key="event.id"
        class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
        @click="navigateToDetail(event.id)"
      >
        <!-- 編集ボタン -->
        <button
          @click="(e) => navigateToEdit(event.id, e)"
          class="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          title="イベントを編集"
        >
          <Pencil class="w-5 h-5" />
        </button>

        <div class="flex items-start justify-between pr-12">
          <div class="flex-grow">
            <!-- イベント名 -->
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ event.name }}
            </h2>

            <!-- イベント情報 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-gray-600">
                <Calendar class="w-5 h-5" />
                <span>{{ formatDate(event.date) }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <MapPin class="w-5 h-5" />
                <span>{{ event.location }}</span>
              </div>
            </div>

            <!-- イベントの説明 -->
            <p class="mt-3 text-gray-600">
              {{ event.description }}
            </p>

            <!-- 日本酒の数 -->
            <div class="mt-4 text-sm text-indigo-600">
              日本酒の数: {{ event._count?.brands || 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
