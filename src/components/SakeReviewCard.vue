<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Heart, MessageCircle, Share2, Loader2, Send, MoreVertical } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase } from '@/utils/supabase'
import { notifyOnComment } from '@/utils/notificationHelper'
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal.vue'
import UserProfileModal from '@/components/modals/UserProfileModal.vue'

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
  profileId: string
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

interface DeleteTarget {
  id: string
  content: string
}

const props = defineProps<{
  review: ReviewProps
}>()

const emit = defineEmits<{
  (e: 'toggle-like', id: string): void
  (e: 'delete-review', id: string): void
  (e: 'update-review', review: Partial<ReviewProps>): void
}>()

const isCommentsOpen = ref(false)
const comments = ref<Comment[]>([])
const newComment = ref('')
const isSubmitting = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const currentUser = ref<Profile>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<DeleteTarget | null>(null)
const isDeletingComment = ref(false)
const showEditModal = ref(false)
const showOptions = ref(false)
const isDeleting = ref(false)
const showDeleteReviewConfirm = ref(false)
const showProfileModal = ref(false)

const getCurrentProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  currentUser.value = profile
}

// 投稿者チェック
const isCurrentUserAuthor = computed(() => {
  return currentUser?.value?.id === props.review.profileId
})

// コメントの取得
const fetchComments = async () => {
  if (!props.review.id) return

  try {
    isLoading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('sake_rating_comments')
      .select(
        `
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
      `,
      )
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
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

    // コメントの投稿
    const { data: commentData, error: insertError } = await supabase
      .from('sake_rating_comments')
      .insert({
        rating_id: props.review.id,
        profile_id: currentUser.value.id,
        content: newComment.value.trim(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    // コメント数の更新
    await supabase
      .from('sake_flavor_ratings')
      .update({
        comments_count: comments.value.length + 1,
      })
      .eq('id', props.review.id)

    // 通知の送信
    if (commentData) {
      await notifyOnComment(
        Number(props.review.id), // rating_id
        commentData.id, // comment_id
        currentUser.value.id, // actor_id
      )
    }

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
const deleteComment = async () => {
  if (!currentUser.value || !deleteTarget.value) return

  try {
    isDeletingComment.value = true
    error.value = null

    const { error: deleteError } = await supabase
      .from('sake_rating_comments')
      .delete()
      .eq('id', deleteTarget.value.id)
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
  } finally {
    isDeletingComment.value = false
    showDeleteConfirm.value = false
    deleteTarget.value = null
  }
}

// レビューの削除
const deleteReview = async () => {
  if (!currentUser.value || !isCurrentUserAuthor.value) return

  try {
    isDeleting.value = true

    const { error: deleteError } = await supabase
      .from('sake_flavor_ratings')
      .delete()
      .eq('id', props.review.id)
      .eq('profile_id', currentUser.value.id)

    if (deleteError) throw deleteError

    emit('delete-review', props.review.id)
  } catch (e) {
    console.error('Error deleting review:', e)
    error.value = 'レビューの削除に失敗しました'
  } finally {
    isDeleting.value = false
    showDeleteReviewConfirm.value = false
  }
}

// レビューの更新
const handleUpdateReview = (updatedReview: Partial<ReviewProps>) => {
  emit('update-review', {
    id: props.review.id,
    ...updatedReview,
  })
  showEditModal.value = false
}

// コメントセクションの開閉
const toggleComments = async () => {
  isCommentsOpen.value = !isCommentsOpen.value
  if (isCommentsOpen.value && comments.value.length === 0) {
    await fetchCurrentUser()
    await fetchComments()
  }
}

// オプションメニューを閉じる
const closeOptions = () => {
  showOptions.value = false
}

// オプションメニューの外側クリック処理
const handleClickOutside = (event: MouseEvent) => {
  const optionsMenu = document.getElementById(`options-menu-${props.review.id}`)
  if (optionsMenu && !optionsMenu.contains(event.target as Node)) {
    closeOptions()
  }
}

// タイムスタンプのフォーマット
const formatTimestamp = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ja })
}

// コメント削除の確認
const confirmDeleteComment = (comment: Comment) => {
  deleteTarget.value = {
    id: comment.id,
    content: comment.content,
  }
  showDeleteConfirm.value = true
}

// 画像読み込みエラー処理
const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  imgElement.src = '/images/default-avatar.png' // デフォルトのアバター画像パスに置き換えてください
}

onMounted(() => {
  getCurrentProfile()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
  >
    <!-- メインのレビューカード部分 -->
    <div class="p-4">
      <!-- ユーザー情報 -->
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <button
            class="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            @click="showProfileModal = true"
          >
            <img
              :src="review.userImage"
              :alt="review.userName"
              class="w-10 h-10 rounded-full object-cover"
            />
          </button>
          <div class="text-left">
            <div class="font-medium text-gray-900">
              {{ review.userName }}
            </div>
            <p class="text-sm text-gray-500">{{ review.timestamp }}</p>
          </div>
        </div>
        <div v-if="isCurrentUserAuthor" class="relative">
          <button
            @click.stop="showOptions = !showOptions"
            class="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical class="w-5 h-5 text-gray-500" />
          </button>
          <!-- ドロップダウンメニュー -->
          <div
            v-if="showOptions"
            :id="`options-menu-${review.id}`"
            class="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg z-10 border"
          >
            <div class="py-1">
              <button
                @click="() => {
                  showDeleteReviewConfirm = true
                  closeOptions()
                }
                "
                class="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left"
              >
                削除
              </button>
            </div>
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
              review.isLiked ? 'fill-current' : 'group-hover:text-red-500',
            ]"
          />
          <span class="text-sm text-gray-500 group-hover:text-gray-700">
            {{ review.likes }}
          </span>
        </button>

        <button @click="toggleComments" class="flex items-center space-x-2 group">
          <MessageCircle class="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
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

        <div v-for="comment in comments" :key="comment.id" class="flex space-x-3">
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
              @click="confirmDeleteComment(comment)"
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
            class="mb-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
            <Send v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
    <!-- レビュー削除確認モーダル -->
    <DeleteConfirmModal
      v-model="showDeleteReviewConfirm"
      title="レビューを削除しますか？"
      :is-submitting="isDeleting"
      @confirm="deleteReview"
    />

    <!-- コメント削除確認モーダル -->
    <DeleteConfirmModal
      v-model="showDeleteConfirm"
      title="コメントを削除しますか？"
      :is-submitting="isDeletingComment"
      @confirm="deleteComment"
    />

    <!-- プロフィールモーダル -->
    <UserProfileModal v-model="showProfileModal" :profile-id="review.profileId" />
  </div>
</template>
