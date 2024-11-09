<script setup lang="ts">
import { Calendar, Star, Book, Settings, Amphora, BookHeartIcon } from 'lucide-vue-next'

const menuItems = [
  { icon: Star, title: "お気に入り" },
  { icon: BookHeartIcon, title: "おすすめ" },
  { icon: Amphora, title: "評価" },
  { icon: Book, title: "日本酒情報" },
  { icon: Calendar, title: "イベント" },
  { icon: Settings, title: "設定" },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 今日のおすすめ -->
    <div class="p-4">
      <div class="aspect-square overflow-hidden rounded-xl shadow-sm bg-white">
        <div class="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600">
          <img
            src=""
            alt="今日のおすすめ"
            class="w-full h-full object-cover"
          >
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <h2 class="text-white text-xl font-bold mb-2">今日のおすすめ</h2>
            <p class="text-white/90 text-sm">獺祭 純米大吟醸 磨き三割九分</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 次回のイベント -->
    <div class="px-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="p-4">
          <div class="flex items-center space-x-4">
            <div class="bg-indigo-100 p-3 rounded-lg">
              <Calendar class="w-6 h-6 text-indigo-600" />
            </div>
            <div class="flex-1">
              <h3 class="text-lg text-gray-700 font-semibold">次回のイベント</h3>
              <p class="text-sm text-gray-600">2024年 秋の日本酒会</p>
              <p class="text-xs text-gray-500 mt-1">11月15日（金）19:00-21:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 機能メニューグリッド -->
    <div class="px-4 pb-8">
      <div class="grid grid-cols-3 gap-4">
        <button
          v-for="(item, index) in menuItems"
          :key="index"
          class="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm
                 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
        >
          <div class="text-indigo-600 mb-2">
            <component :is="item.icon" class="w-8 h-8" />
          </div>
          <span class="text-sm text-gray-700">{{ item.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* タップ時のハイライトを無効化 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* スムーズスクロール */
html {
  scroll-behavior: smooth;
}

/* ボタンのアクティブ状態 */
button:active {
  transform: scale(0.98);
}
</style>
