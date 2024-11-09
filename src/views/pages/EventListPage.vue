<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/utils/supabase'
import { Plus, Calendar, MapPin, Users } from 'lucide-vue-next';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import ErrorDisplay from '../../components/ErrorDisplay.vue';
import AppHeader from '@/components/AppHeader.vue'

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  created_at: string;
}

const router = useRouter();
const events = ref<Event[]>([]);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const fetchEvents = async () => {
  isLoading.value = true;
  loadError.value = null;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')

    if (error) throw error;
    events.value = data;
  } catch (error) {
    loadError.value = '開催予定のイベント情報の取得に失敗しました。';
    console.error('Error fetching events:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });
};

const navigateToCreate = () => {
  router.push('/events/create');
};

onMounted(() => {
  fetchEvents();
});
</script>

<template>
  <div class="max-w-3xl mx-auto bg-gray-50 min-h-screen">
    <AppHeader />
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

    <LoadingSpinner v-if="isLoading" />

    <ErrorDisplay
      v-else-if="loadError"
      :message="loadError"
      :onRetry="fetchEvents"
    />

    <div v-else-if="events.length === 0" class="text-center py-12">
      <p class="text-gray-500">開催予定のイベントはありません</p>
    </div>

    <div v-else class="space-y-4 px-4">
      <div
        v-for="event in events"
        :key="event.id"
        class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
        @click="router.push(`/events/${event.id}/edit`)"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">
              {{ event.name }}
            </h2>
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
            <p class="mt-3 text-gray-600">
              {{ event.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
