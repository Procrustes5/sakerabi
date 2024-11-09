<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { supabase } from '@/utils/supabase'

interface EventForm {
  name: string;
  date: string;
  location: string;
  description: string;
}

const router = useRouter();
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

const form = ref<EventForm>({
  name: '',
  date: '',
  location: '',
  description: ''
});

const handleSubmit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  submitError.value = null;

  try {
    const { error } = await supabase
      .from('events')
      .insert([{
        name: form.value.name,
        date: form.value.date,
        location: form.value.location,
        description: form.value.description
      }]);

    if (error) throw error;

    router.push('/events');
  } catch (error) {
    submitError.value = 'イベントの作成に失敗しました。';
    console.error('Error creating event:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-6">
    <button
      @click="goBack"
      class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
    >
      <ArrowLeft class="w-5 h-5" />
      <span>戻る</span>
    </button>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">新しいイベントを作成</h1>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            イベント名 *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-1">
            開催日 *
          </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 mb-1">
            開催場所 *
          </label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            イベント詳細 *
          </label>
          <textarea
            id="description"
            v-model="form.description"
            required
            rows="4"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '作成中...' : 'イベントを作成' }}
          </button>
        </div>

        <p v-if="submitError" class="text-red-500 text-sm mt-2">
          {{ submitError }}
        </p>
      </form>
    </div>
  </div>
</template>
