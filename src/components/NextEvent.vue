<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Calendar } from 'lucide-vue-next';
import { supabase } from '@/utils/supabase'

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
}

const upcomingEvent = ref<Event | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchUpcomingEvent = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error: supabaseError } = await supabase
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .single();

    if (supabaseError) throw supabaseError;
    upcomingEvent.value = data;
  } catch (err) {
    console.error('Error fetching upcoming event:', err);
    error.value = '次回イベントの取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

onMounted(() => {
  fetchUpcomingEvent();
});
</script>

<template>
  <div v-if="isLoading" class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-4">
      <div class="animate-pulse flex items-center space-x-4">
        <div class="bg-indigo-100 p-3 rounded-lg">
          <div class="w-6 h-6 bg-indigo-200 rounded" />
        </div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-4">
      <p class="text-red-500 text-sm">{{ error }}</p>
    </div>
  </div>

  <div v-else-if="!upcomingEvent" class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-4">
      <div class="flex items-center space-x-4">
        <div class="bg-gray-100 p-3 rounded-lg">
          <Calendar class="w-6 h-6 text-gray-400" />
        </div>
        <div class="flex-1">
          <p class="text-gray-500">開催予定のイベントはありません</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-4">
      <div class="flex items-center space-x-4">
        <div class="bg-indigo-100 p-3 rounded-lg">
          <Calendar class="w-6 h-6 text-indigo-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg text-gray-700 font-semibold">次回のイベント</h3>
          <p class="text-sm text-gray-600">{{ upcomingEvent.name }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ formatDateTime(upcomingEvent.date) }}</p>
          <p class="text-xs text-gray-500">{{ upcomingEvent.location }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
