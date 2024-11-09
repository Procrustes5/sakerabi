<!-- src/components/ErrorDisplay.vue -->
<script setup lang="ts">
defineProps<{
  message: string;
  onRetry: () => void;
}>();
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-gray-50">
    <div class="flex flex-col items-center space-y-4 p-6 text-center">
      <span class="text-red-500 text-lg">😢</span>
      <p class="text-gray-600">{{ message }}</p>
      <button
        @click="onRetry"
        class="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors"
      >
        再試行
      </button>
    </div>
  </div>
</template>
