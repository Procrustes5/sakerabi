<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Trash2 } from 'lucide-vue-next'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import ErrorDisplay from '../../components/ErrorDisplay.vue'
import { supabase } from '@/utils/supabase'

interface EventForm {
  name: string
  date: string
  location: string
  description: string
}

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const showDeleteConfirm = ref(false)

const form = ref<EventForm>({
  name: '',
  date: '',
  location: '',
  description: '',
})

// イベント情報の取得
const fetchEvent = async () => {
  isLoading.value = true
  loadError.value = null

  try {
    const { data, error } = await supabase.from('events').select('*').eq('id', props.id).single()

    if (error) throw error
    if (!data) throw new Error('イベントが見つかりません')

    form.value = {
      name: data.name,
      date: data.date,
      location: data.location,
      description: data.description,
    }
  } catch (error) {
    loadError.value = 'イベント情報の取得に失敗しました。'
    console.error('Error fetching event:', error)
  } finally {
    isLoading.value = false
  }
}

// 更新の実行
const handleSubmit = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = null

  try {
    const { error } = await supabase
      .from('events')
      .update({
        name: form.value.name,
        date: form.value.date,
        location: form.value.location,
        description: form.value.description,
      })
      .eq('id', props.id)

    if (error) throw error

    router.push('/events')
  } catch (error) {
    submitError.value = 'イベントの更新に失敗しました。'
    console.error('Error updating event:', error)
  } finally {
    isSubmitting.value = false
  }
}

// 削除の実行
const handleDelete = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = null

  try {
    const { error } = await supabase.from('events').delete().eq('id', props.id)

    if (error) throw error

    router.push('/events')
  } catch (error) {
    submitError.value = 'イベントの削除に失敗しました。'
    console.error('Error deleting event:', error)
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchEvent()
})
</script>

<template>
  <div class="max-w-2xl mx-auto bg-gray-50 px-4 py-6">
    <button @click="goBack" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
      <ArrowLeft class="w-5 h-5" />
      <span>戻る</span>
    </button>

    <LoadingSpinner v-if="isLoading" />

    <ErrorDisplay v-else-if="loadError" :message="loadError" :onRetry="fetchEvent" />

    <div v-else class="bg-white rounded-xl shadow-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">イベントを編集</h1>
        <button
          @click="showDeleteConfirm = true"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 class="w-5 h-5" />
          <span>削除</span>
        </button>
      </div>

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
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
          />
        </div>

        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-1"> 開催日 * </label>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
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
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
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
            class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
          />
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '更新中...' : '変更を保存' }}
          </button>
        </div>

        <p v-if="submitError" class="text-red-500 text-sm mt-2">
          {{ submitError }}
        </p>
      </form>
    </div>

    <!-- 削除確認モーダル -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-gray-900 mb-4">イベントを削除しますか？</h3>
        <p class="text-gray-600 mb-6">この操作は取り消すことができません。</p>
        <div class="flex justify-end gap-4">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            @click="handleDelete"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
