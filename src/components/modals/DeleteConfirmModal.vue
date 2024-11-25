<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  isSubmitting?: boolean
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '本当に削除しますか？',
  description: 'この操作は取り消すことができません。',
  isSubmitting: false,
  confirmText: '削除する',
  cancelText: 'キャンセル',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div class="bg-white rounded-xl p-6 max-w-md w-full">
      <h3 class="text-xl font-bold text-gray-900 mb-4">{{ title }}</h3>
      <p class="text-gray-600 mb-6">{{ description }}</p>
      <div class="flex justify-end gap-4">
        <button
          @click="closeModal"
          class="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="emit('confirm')"
          :disabled="isSubmitting"
          class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? '削除中...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
