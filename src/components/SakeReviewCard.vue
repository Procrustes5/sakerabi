<script setup lang="ts">
import { ref } from 'vue';
import { Heart, MessageCircle, Share2, MapPin, Calendar } from 'lucide-vue-next';

interface SakeReview {
  id: string;
  userImage: string;
  userName: string;
  timestamp: string;
  sakeName: string;
  rating: number;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  event?: {
    name: string;
    date: string;
    location: string;
  };
}

const props = defineProps<{
  review: SakeReview;
}>();

const isLiked = ref(false);
const likesCount = ref(props.review.likes);

const handleLike = () => {
  if (isLiked.value) {
    likesCount.value--;
  } else {
    likesCount.value++;
  }
  isLiked.value = !isLiked.value;
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
    <!-- ユーザー情報 -->
    <div class="p-4 flex items-center space-x-3">
      <img
        :src="review.userImage"
        :alt="review.userName"
        class="w-10 h-10 rounded-full object-cover"
      >
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900">{{ review.userName }}</h3>
        <p class="text-xs text-gray-500">{{ review.timestamp }}</p>
      </div>
    </div>

    <!-- 日本酒情報 -->
    <div class="px-4 py-2">
      <h4 class="text-lg font-medium text-gray-900">{{ review.sakeName }}</h4>
      <div class="flex items-center mt-1">
        <div class="flex">
          <template v-for="i in 5" :key="i">
            <svg
              :class="[
                'w-4 h-4',
                i <= review.rating ? 'text-yellow-400' : 'text-gray-300'
              ]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </template>
        </div>
      </div>
    </div>

    <!-- レビュー内容 -->
    <p class="px-4 py-2 text-gray-700">{{ review.content }}</p>

    <!-- 画像（存在する場合） -->
    <img
      v-if="review.image"
      :src="review.image"
      :alt="review.sakeName"
      class="w-full aspect-video object-cover"
    >

    <!-- イベント情報（存在する場合） -->
    <div v-if="review.event" class="px-4 py-2 bg-gray-50">
      <div class="flex items-center space-x-4">
        <div class="flex items-center text-gray-600">
          <Calendar class="w-4 h-4 mr-1" />
          <span class="text-sm">{{ review.event.date }}</span>
        </div>
        <div class="flex items-center text-gray-600">
          <MapPin class="w-4 h-4 mr-1" />
          <span class="text-sm">{{ review.event.location }}</span>
        </div>
      </div>
      <p class="text-sm text-gray-700 mt-1">{{ review.event.name }}</p>
    </div>

    <!-- アクション -->
    <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
      <button
        @click="handleLike"
        class="flex items-center space-x-2"
        :class="{ 'text-red-500': isLiked, 'text-gray-600': !isLiked }"
      >
        <Heart class="w-5 h-5" :fill="isLiked ? 'currentColor' : 'none'" />
        <span class="text-sm">{{ likesCount }}</span>
      </button>
      <button class="flex items-center space-x-2 text-gray-600">
        <MessageCircle class="w-5 h-5" />
        <span class="text-sm">{{ review.comments }}</span>
      </button>
      <button class="flex items-center space-x-2 text-gray-600">
        <Share2 class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.like-button-enter-active,
.like-button-leave-active {
  transition: all 0.3s ease;
}

.like-button-enter-from,
.like-button-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>
