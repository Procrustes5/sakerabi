<script setup lang="ts">
import { ref } from 'vue';
import { Bell, Search } from 'lucide-vue-next';

const hasNotification = ref(true);  // 通知の有無を制御
const isScrolled = ref(false);

// スクロール位置に応じてヘッダーの見た目を変更
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 10;
  });
}
</script>

<template>
  <header
    class="sticky top-0 z-50 transition-all duration-300"
    :class="[
      isScrolled
        ? 'bg-white/80 backdrop-blur-lg shadow-sm'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- ロゴ部分 -->
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
            <div class="text-white font-bold text-lg transform hover:scale-110 transition-transform duration-300">
              S
            </div>
          </div>
          <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            sakerabi
          </h1>
        </div>

        <!-- 右側のアクション -->
        <div class="flex items-center space-x-4">
          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200">
            <Search class="w-5 h-5 text-gray-600" />
          </button>

          <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 relative">
            <Bell class="w-5 h-5 text-gray-600" />
            <!-- 通知バッジ -->
            <span
              v-if="hasNotification"
              class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
            />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ロゴのテキストにシャドウ効果を追加 */
h1 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* ホバー時のアニメーション */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.bg-gradient-to-br {
  animation: gradient 6s ease infinite;
  background-size: 200% 200%;
}
</style>
