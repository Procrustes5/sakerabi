<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { XMark } from 'lucide-vue-next'
import { supabase } from '@/utils/supabase'

interface ReviewProps {
  id: string
  content: string
  sakeName: string
  rating: number
  image: string | null
}

const props = defineProps<{
  modelValue: boolean
  review: ReviewProps
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'update', review: Partial<ReviewProps>): void
}>()

const content = ref(props.review.content)
const rating = ref(props.review.rating)
const isSubmitting = ref(false)
const error = ref<string | null>(null)

const closeModal = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!content.value.trim()) return

  try {
    isSubmitting.value = true
    error.value = null

    const { error: updateError } = await supabase
      .from('sake_flavor_ratings')
      .update({
        content: content.value.trim(),
        rating: rating.value,
      })
      .eq('id', props.review.id)

    if (updateError) throw updateError

    emit('update', {
      content: content.value.trim(),
      rating: rating.value,
    })
    closeModal()
  } catch (e) {
    console.error('Error updating review:', e)
    error.value = 'レビューの更新に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Dialog as="div" class="relative z-50" :open="modelValue" @close="closeModal">
    <div class="fixed inset-0 bg-black/30" />

    <div class="fixed inset-0 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4">
        <DialogPanel
          class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
        >
          <div class="flex items-center justify-between mb-4">
            <DialogTitle as="h3" class="text-lg font-medium text-gray-900">
              レビューを編集
            </DialogTitle>
            <button
              @click="closeModal"
              class="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <XMark class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <!-- エラーメッセージ -->
          <div v-if="error" class="mb-4 text-sm text-red-600">
            {{ error }}
          </div>

          <!-- 評価入力 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"> 評価 </label>
            <input
              v-model="rating"
              type="number"
              min="1"
              max="5"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <!-- レビュー内容入力 -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1"> レビュー内容 </label>
            <textarea
              v-model="content"
              rows="4"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              :disabled="isSubmitting"
            />
          </div>

          <!-- 送信ボタン -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="isSubmitting"
            >
              キャンセル
            </button>
            <button
              @click="handleSubmit"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitting || !content.trim()"
            >
              {{ isSubmitting ? '更新中...' : '更新する' }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </div>
  </Dialog>
</template>
