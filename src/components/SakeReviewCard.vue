<script setup lang="ts">
import { ref } from 'vue'
import { Heart, MessageCircle, Share2, Star } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

interface Event {
  name: string
  date: string
  location: string
}

interface ReviewProps {
  id: string
  userImage: string
  userName: string
  timestamp: string
  sakeName: string
  rating: number
  content: string
  image: string | null
  likes: number
  comments: number
  isLiked?: boolean
  event: Event
}

const props = defineProps<{
  review: ReviewProps
}>()

const emit = defineEmits<{
  (e: 'toggle-like', id: string): void
  (e: 'show-comments'): void
}>()

const router = useRouter()
const imageError = ref(false)
const showFullContent = ref(false)
const isContentLong = ref(false)

// コンテンツの長さをチェック（150文字以上で省略）
const checkContentLength = () => {
  isContentLong.value = props.review.content.length > 150
}

// 画像読み込みエラー時のハンドラー
const handleImageError = () => {
  imageError.value = true
}

// ユーザープロフィールページへの遷移
const navigateToProfile = () => {
  router.push(`/users/${props.review.id}`)
}

// シェア機能
const shareReview = async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${props.review.userName}さんの${props.review.sakeName}の感想`,
        text: props.review.content,
        url: window.location.href,
      })
    } else {
      // フォールバック: URLをクリップボードにコピー
      await navigator.clipboard.writeText(window.location.href)
      // TODO: コピー成功を通知
    }
  } catch (error) {
    console.error('Error sharing:', error)
  }
}

checkContentLength()
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
  >
    <!-- ヘッダー部分 -->
    <div class="p-4">
      <div class="flex items-start justify-between">
        <!-- ユーザー情報 -->
        <div class="flex items-center space-x-3">
          <button @click="navigateToProfile" class="block">
            <img
              :src="review.userImage"
              :alt="review.userName"
              class="w-10 h-10 rounded-full object-cover"
              @error="handleImageError"
              v-if="!imageError"
            />
            <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-gray-500 text-sm">
                {{ review.userName.charAt(0) }}
              </span>
            </div>
          </button>
          <div>
            <button
              @click="navigateToProfile"
              class="font-medium text-gray-900 hover:text-gray-600"
            >
              {{ review.userName }}
            </button>
            <p class="text-sm text-gray-500">{{ review.timestamp }}</p>
          </div>
        </div>
      </div>

      <!-- 日本酒名 -->
      <h3 class="mt-2 text-lg font-semibold text-gray-900">
        {{ review.sakeName }}
      </h3>

      <!-- イベント情報 -->
      <div class="mt-1 text-sm text-gray-500">
        <p>{{ review.event.name }}</p>
        <p>{{ review.event.date }} @ {{ review.event.location }}</p>
      </div>

      <!-- レビュー内容 -->
      <div class="mt-3">
        <p :class="['text-gray-700', { 'line-clamp-3': isContentLong && !showFullContent }]">
          {{ review.content }}
        </p>
        <button
          v-if="isContentLong"
          @click="showFullContent = !showFullContent"
          class="mt-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          {{ showFullContent ? '閉じる' : '続きを読む' }}
        </button>
      </div>

      <!-- 画像 -->
      <div v-if="review.image" class="mt-3">
        <img
          :src="review.image"
          :alt="review.sakeName"
          class="rounded-lg w-full h-auto object-cover max-h-96"
          @error="handleImageError"
        />
      </div>

      <!-- アクションボタン -->
      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <!-- いいねボタン -->
          <button
            @click="$emit('toggle-like', review.id)"
            class="flex items-center space-x-2 group"
            :class="{ 'text-red-500': review.isLiked }"
          >
            <Heart
              :class="[
                'w-5 h-5 transition-colors',
                review.isLiked ? 'fill-current' : 'group-hover:text-red-500',
              ]"
            />
            <span class="text-sm text-gray-500 group-hover:text-gray-700">
              {{ review.likes }}
            </span>
          </button>

          <!-- コメントボタン -->
          <button @click="$emit('show-comments')" class="flex items-center space-x-2 group">
            <MessageCircle class="w-5 h-5 group-hover:text-indigo-500" />
            <span class="text-sm text-gray-500 group-hover:text-gray-700">
              {{ review.comments }}
            </span>
          </button>

          <!-- シェアボタン -->
          <button @click="shareReview" class="group">
            <Share2 class="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
