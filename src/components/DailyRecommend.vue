<script setup lang="ts">
import { onMounted } from 'vue';
import { useDailyRecommend } from '@/composables/useDailyRecommend';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import FlavorTags from './FlavorTags.vue';
import FlavorChart from './FlavorChart.vue';

const {
  brand,
  isLoading,
  loadError,
  displayFlavorChart,
  fetchDailyRecommend,
  retryLoad
} = useDailyRecommend();

onMounted(() => {
  fetchDailyRecommend();
});
</script>

<template>
  <div class="aspect-square overflow-hidden rounded-xl shadow-sm bg-white">
    <LoadingSpinner v-if="isLoading" />

    <ErrorDisplay
      v-else-if="loadError"
      :message="loadError"
      :onRetry="retryLoad"
    />

    <div v-else-if="brand" class="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600">
      <div class="absolute inset-0 bg-pattern opacity-10"></div>

      <div class="w-full h-full flex items-center justify-center">
        <div class="text-white text-8xl opacity-50">🍶</div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <h2 class="text-white text-xl font-bold mb-2">今日のおすすめ</h2>
        <p class="text-white/90 text-lg">{{ brand.name }}</p>
      </div>

      <FlavorTags
        class="absolute top-4 right-4"
      />

      <FlavorChart
        class="absolute top-4 left-4"
        :data="displayFlavorChart"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
  background-size: 20px 20px;
}
</style>
