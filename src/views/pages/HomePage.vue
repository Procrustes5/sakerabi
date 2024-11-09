<script setup lang="ts">
import DailyRecommend from '../../components/DailyRecommend.vue';
import NextEvent from '../../components/NextEvent.vue';
import MenuGrid from '../../components/MenuGrid.vue';
import Timeline from '../../components/Timeline.vue';
import AppHeader from '../../components/AppHeader.vue';
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <!-- 今日のおすすめ -->
    <div class="p-4">
      <DailyRecommend
        imageUrl=""
        title="今日のおすすめ"
        sakeName="獺祭 純米大吟醸 磨き三割九分"
      />
    </div>

    <!-- 次回のイベント -->
    <div class="px-4 mb-6">
      <NextEvent
        title="次回のイベント"
        eventName="2024年 秋の日本酒会"
        dateTime="11月15日（金）19:00-21:00"
      />
    </div>

    <!-- 機能メニューグリッド -->
    <div class="px-4 pb-8">
      <MenuGrid />
    </div>

    <!-- タイムライン -->
    <div class="mt-6">
      <Timeline />
    </div>
  </div>
</template>
