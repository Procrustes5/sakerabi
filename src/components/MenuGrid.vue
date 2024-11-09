<script setup lang="ts">
import { Calendar, Star, Book, Settings, Amphora, BookHeartIcon } from 'lucide-vue-next';
import MenuItem from './MenuItem.vue';

const menuItems = [
  { icon: Star, title: "お気に入り" },
  { icon: BookHeartIcon, title: "おすすめ" },
  { icon: Amphora, title: "評価" },
  { icon: Book, title: "日本酒情報" },
  { icon: Calendar, title: "イベント" },
  { icon: Settings, title: "設定" },
];
</script>

<template>
  <div class="grid grid-cols-3 gap-4">
    <MenuItem
      v-for="(item, index) in menuItems"
      :key="index"
      :icon="item.icon"
      :title="item.title"
    />
  </div>
</template>
