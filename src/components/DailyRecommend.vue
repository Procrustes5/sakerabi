<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useDailyRecommend } from '@/composables/useDailyRecommend';
import LoadingSpinner from './LoadingSpinner.vue';
import ErrorDisplay from './ErrorDisplay.vue';
import FlavorTags from './FlavorTags.vue';
import FlavorChart from './FlavorChart.vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const {
  brands,
  currentIndex,
  isLoading,
  loadError,
  fetchDailyRecommends,
  nextSlide,
  prevSlide,
  setCurrentIndex,
  retryLoad
} = useDailyRecommend();

// 自動再生の制御
const autoplayInterval = ref<number | null>(null);

const startAutoplay = () => {
  stopAutoplay();
  autoplayInterval.value = window.setInterval(nextSlide, 5000);
};

const stopAutoplay = () => {
  if (autoplayInterval.value) {
    clearInterval(autoplayInterval.value);
    autoplayInterval.value = null;
  }
};

// スワイプ関連の状態と処理
const touchStart = ref(0);
const touchEnd = ref(0);
const isSwiping = ref(false);

const handleTouchStart = (e: TouchEvent) => {
  touchStart.value = e.touches[0].clientX;
  isSwiping.value = true;
  stopAutoplay();
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return;
  touchEnd.value = e.touches[0].clientX;
};

const handleTouchEnd = () => {
  isSwiping.value = false;
  const swipeDistance = touchEnd.value - touchStart.value;
  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      prevSlide();
    } else {
      nextSlide();
    }
  }
  startAutoplay();
};

// コンポーネントのライフサイクル
onMounted(() => {
  fetchDailyRecommends().then(() => {
    if (brands.value.length > 0) {
      startAutoplay();
    }
  });
});

onUnmounted(() => {
  stopAutoplay();
});
</script>

<template>
  <div class="aspect-square overflow-hidden rounded-xl shadow-sm bg-white relative">
    <LoadingSpinner v-if="isLoading" />

    <ErrorDisplay
      v-else-if="loadError"
      :message="loadError"
      :onRetry="retryLoad"
    />

    <div
      v-else-if="brands.length > 0"
      class="w-full h-full overflow-hidden"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- カルーセルコンテナ -->
      <div
        class="flex h-full transition-transform duration-300 ease-in-out"
        :style="{
          transform: `translateX(-${currentIndex * 100}%)`,
          width: `${brands.length * 100}%`
        }"
      >
        <div
          v-for="brand in brands"
          :key="brand.id"
          class="w-full h-full flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 relative"
        >
          <!-- パターン背景 -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 z-0">
            <div class="absolute inset-0 bg-pattern opacity-10"></div>
          </div>

          <!-- メインコンテンツ -->
          <div class="relative w-full h-full">
            <!-- 日本酒アイコン -->
            <div class="absolute bottom-1/3 left-36 flex items-center justify-center pointer-events-none">
              <div class="sake-icon text-8xl text-white">🍶</div>
            </div>
            <!-- フレーバーチャートとタグ -->
            <div class="relative z-10">
              <FlavorChart
                v-if="brand.flavor_chart"
                class="absolute top-4 left-4"
                :data="brand.flavor_chart"
              />
              <FlavorTags class="absolute top-4 right-4" />
            </div>

            <!-- タイトルと説明 -->
            <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <h2 class="text-white text-xl font-bold mb-2">
                本日のおすすめ
              </h2>
              <p class="text-white/90 text-lg">{{ brand.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ナビゲーションボタン -->
      <button
        class="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors z-20"
        @click="prevSlide"
        @mouseenter="stopAutoplay"
        @mouseleave="startAutoplay"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>
      <button
        class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors z-20"
        @click="nextSlide"
        @mouseenter="stopAutoplay"
        @mouseleave="startAutoplay"
      >
        <ChevronRight class="w-6 h-6" />
      </button>

      <!-- インジケーター -->
      <div class="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        <button
          v-for="(_, index) in brands"
          :key="index"
          class="w-2 h-2 rounded-full transition-colors"
          :class="index === currentIndex ? 'bg-white' : 'bg-white/50'"
          @click="setCurrentIndex(index)"
          @mouseenter="stopAutoplay"
          @mouseleave="startAutoplay"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-pattern {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
  background-size: 20px 20px;
}

.sake-icon {
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}
</style>
