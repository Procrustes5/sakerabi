<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-indigo-500 to-purple-600 p-6">
    <div class="flex flex-col items-center justify-center min-h-screen">
      <!-- Logo/Title Section -->
      <div class="text-center mt-32 mb-24">
        <h1 class="text-6xl font-bold text-white mb-6 tracking-wide">sakerabi</h1>
        <p class="text-indigo-100 text-md">日本酒会の楽しみ方を広げる</p>
      </div>

      <!-- Start Button -->
      <div class="w-full max-w-xs">
        <button
          class="w-full bg-white rounded-full py-4 px-8 text-indigo-600 font-medium
                 shadow-lg transform transition duration-200 hover:scale-105
                 active:scale-95 focus:outline-none"
          @click="router.push('/start')"
        >
          <span class="text-lg">始める</span>
        </button>

        <!-- Additional Options -->
        <div class="mt-8 flex justify-center space-x-4">
          <a href="#" class="text-indigo-100 text-sm hover:text-white transition">ログイン</a>
          <span class="text-indigo-200">|</span>
          <a href="#" class="text-indigo-100 text-sm hover:text-white transition">ヘルプ</a>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
// Add touch-friendly tap states
button {
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.95);
  }
}

// Ensure smooth scrolling
html {
  scroll-behavior: smooth;
}

// Remove blue highlight on mobile tap
* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
</style>
