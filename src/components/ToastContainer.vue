<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle, XCircle, Info } from 'lucide-vue-next'
import { TransitionGroup } from 'vue'

const { toasts, remove } = useToast()

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return XCircle
    case 'info':
      return Info
    default:
      return Info
  }
}

const getToastClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'error':
      return 'bg-red-50 text-red-600 border-red-100'
    case 'info':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100'
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100'
  }
}

const handleSwipe = (id: number) => {
  remove(id)
}
</script>

<template>
  <div
    class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center p-4 gap-2"
  >
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-8"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto w-full max-w-sm rounded-2xl shadow-sm border px-4 py-3 flex items-center gap-3 transform transition-transform active:scale-98"
        :class="getToastClass(toast.type)"
        @click="remove(toast.id)"
        @touchstart="handleSwipe(toast.id)"
      >
        <component
          :is="getIcon(toast.type)"
          class="w-5 h-5 flex-shrink-0"
        />
        <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.transform {
  will-change: transform;
}
</style>
