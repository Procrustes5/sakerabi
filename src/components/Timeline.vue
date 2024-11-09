<script setup lang="ts">
import { ref } from 'vue';
import SakeReviewCard from './SakeReviewCard.vue';
const isLoading = ref(false);
const hasMore = ref(true);
const refreshing = ref(false);

const onRefresh = async () => {
  refreshing.value = true;
  // 最新データの取得
  refreshing.value = false;
};

const loadMore = async () => {
  if (isLoading.value || !hasMore.value) return;
  isLoading.value = true;
  // API呼び出しなど
  isLoading.value = false;
};
// サンプルデータ
const reviews = ref([
  {
    id: '1',
    userImage: '/path/to/user1.jpg',
    userName: '田中翔太',
    timestamp: '2時間前',
    sakeName: '獺祭 純米大吟醸 磨き三割九分',
    rating: 5,
    content: '香りが華やかで、口当たりがとても滑らか。フルーティーな味わいが特徴的で、後味も爽やか。',
    image: '/path/to/sake1.jpg',
    likes: 24,
    comments: 3,
    event: {
      name: '2024年 春の日本酒会',
      date: '2024/03/15',
      location: '恵比寿ガーデンホール'
    }
  },
  {
    id: '2',
    userImage: '/path/to/user2.jpg',
    userName: '山田花子',
    timestamp: '4時間前',
    sakeName: '久保田 千寿',
    rating: 4,
    content: 'バランスの取れた味わいで、食事との相性も抜群。普段使いにも最適な一本。',
    likes: 18,
    comments: 5,
    event: {
      name: '新潟酒フェス2024',
      date: '2024/03/10',
      location: '代々木公園イベント広場'
    }
  }
]);
</script>

<template>
  <div class="py-4">
    <h2 class="text-xl font-bold text-gray-900 mb-4 px-4">タイムライン</h2>
    <div class="space-y-4 px-4">
      <SakeReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
      />
    </div>
  </div>
</template>
