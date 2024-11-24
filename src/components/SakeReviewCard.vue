<script setup lang="ts">
import { ref } from 'vue'
import { Heart, MessageCircle, Share2, Loader2, Send } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase } from '@/utils/supabase'

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

interface Comment {
  id: string
  profile_id: string
  rating_id: string
  content: string
  created_at: string
  profile: {
    id: string
    display_name: string
    avatar_url: string
  }
}

const props = defineProps<{
  review: ReviewProps
}>()

const emit = defineEmits<{
  (e: 'toggle-like', id: string): void
}>()

const isCommentsOpen = ref(false)
const comments = ref<Comment[]>([])
const newComment = ref('')
const isSubmitting = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentUser = ref<any>(null)

// コメントの取得
const fetchComments = async () => {
  if (!props.review.id) return

  try {
    isLoading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('sake_rating_comments')
      .select(`
        id,
        profile_id,
        rating_id,
        content,
        created_at,
        profile:profiles(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('rating_id', props.review.id)
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    comments.value = data || []
  } catch (e) {
    console.error('Error fetching comments:', e)
    error.value = 'コメントの取得に失敗しました'
  } finally {
    isLoading.value = false
  }
}

// 現在のユーザー情報の取得
const fetchCurrentUser = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    currentUser.value = user
  } catch (e) {
    console.error('Error fetching current user:', e)
    currentUser.value = null
  }
}

// コメントの投稿
const submitComment = async () => {
  if (!newComment.value.trim() || !currentUser.value) return

  try {
    isSubmitting.value = true
    error.value = null

    const { error: insertError } = await supabase
      .from('sake_rating_comments')
      .insert({
        rating_id: props.review.id,
        profile_id: currentUser.value.id,
        content: newComment.value.trim(),
      })

    if (insertError) throw insertError

    // コメント投稿後にコメント数を更新
    await supabase
      .from('sake_flavor_ratings')
      .update({
        comments_count: comments.value.length + 1,
      })
      .eq('id', props.review.id)

    newComment.value = ''
    await fetchComments()
  } catch (e) {
    console.error('Error submitting comment:', e)
    error.value = 'コメントの投稿に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

// コメントの削除
const deleteComment = async (commentId: string) => {
  if (!currentUser.value) return

  try {
    const { error: deleteError } = await supabase
      .from('sake_rating_comments')
      .delete()
      .eq('id', commentId)
      .eq('profile_id', currentUser.value.id)

    if (deleteError) throw deleteError

    // コメント削除後にコメント数を更新
    await supabase
      .from('sake_flavor_ratings')
      .update({
        comments_count: comments.value.length - 1,
      })
      .eq('id', props.review.id)

    await fetchComments()
  } catch (e) {
    console.error('Error deleting comment:', e)
    error.value = 'コメントの削除に失敗しました'
  }
}

// コメントセクションの開閉
const toggleComments = async () => {
  isCommentsOpen.value = !isCommentsOpen.value
  if (isCommentsOpen.value && comments.value.length === 0) {
    await fetchCurrentUser()
    await fetchComments()
  }
}

// タイムスタンプのフォーマット
const formatTimestamp = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ja })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
    <!-- メインのレビューカード部分 -->
    <div class="p-4">
      <!-- ユーザー情報 -->
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <img
            :src="review.userImage"
            :alt="review.userName"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div class="font-medium text-gray-900">
              {{ review.userName }}
            </div>
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
        <p class="text-gray-700">{{ review.content }}</p>
      </div>

      <!-- レビュー画像 -->
      <div v-if="review.image" class="mt-3">
        <img
          :src="review.image"
          :alt="review.sakeName"
          class="rounded-lg w-full h-auto object-cover max-h-96"
        />
      </div>

      <!-- アクションボタン -->
      <div class="mt-4 flex items-center space-x-6">
        <button
          @click="$emit('toggle-like', review.id)"
          class="flex items-center space-x-2 group"
          :class="{ 'text-red-500': review.isLiked }"
        >
          <Heart
            :class="[
              'w-5 h-5 transition-colors',
              review.isLiked ? 'fill-current' : 'group-hover:text-red-500'
            ]"
          />
          <span class="text-sm text-gray-500 group-hover:text-gray-700">
            {{ review.likes }}
          </span>
        </button>

        <button
          @click="toggleComments"
          class="flex items-center space-x-2 group"
        >
          <MessageCircle
            class="w-5 h-5 text-gray-400 group-hover:text-blue-500"
          />
          <span class="text-sm text-gray-500 group-hover:text-gray-700">
            {{ review.comments }}
          </span>
        </button>

        <button class="group">
          <Share2 class="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
        </button>
      </div>
    </div>

    <!-- コメントセクション -->
    <div v-if="isCommentsOpen" class="border-t bg-gray-50">
      <!-- ローディング -->
      <div v-if="isLoading" class="flex justify-center p-4">
        <Loader2 class="w-6 h-6 text-gray-400 animate-spin" />
      </div>

      <!-- エラー -->
      <div v-else-if="error" class="p-4 text-red-500 text-center">
        {{ error }}
      </div>

      <!-- コメントリスト -->
      <div v-else class="p-4 space-y-4">
        <div v-if="comments.length === 0" class="text-center text-gray-500 py-4">
          まだコメントはありません
        </div>

        <div
          v-for="comment in comments"
          :key="comment.id"
          class="flex space-x-3"
        >
          <img
            :src="comment.profile.avatar_url"
            :alt="comment.profile.display_name"
            class="w-8 h-8 rounded-full"
            @error="handleImageError"
          />
          <div class="flex-1">
            <div class="bg-white rounded-lg p-3 shadow-sm">
              <div class="flex items-center justify-between mb-1">
            <span class="font-medium text-gray-900">
              {{ comment.profile.display_name }}
            </span>
                <span class="text-xs text-gray-500">
              {{ formatTimestamp(comment.created_at) }}
            </span>
              </div>
              <p class="text-gray-700">{{ comment.content }}</p>
            </div>
            <!-- 削除ボタン（自分のコメントの場合） -->
            <button
              v-if="currentUser?.id === comment.profile_id"
              @click="deleteComment(comment.id)"
              class="text-xs text-gray-500 hover:text-red-500 mt-1 ml-1"
            >
              削除
            </button>
          </div>
        </div>
      </div>

      <!-- コメント入力フォーム -->
      <div class="p-4 border-t bg-white">
        <div v-if="!currentUser" class="text-center text-gray-500">
          コメントを投稿するにはログインが必要です
        </div>
        <div v-else class="flex items-end space-x-2">
          <div class="flex-1 h-full">
        <textarea
          v-model="newComment"
          rows="2"
          class="w-full h-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-600"
          placeholder="コメントを入力..."
          :disabled="isSubmitting"
        />
          </div>
          <button
            @click="submitComment"
            :disabled="!newComment.trim() || isSubmitting"
            class="mb-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2
              v-if="isSubmitting"
              class="w-5 h-5 animate-spin"
            />
            <Send
              v-else
              class="w-5 h-5"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
