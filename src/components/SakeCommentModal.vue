<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { X, Send, Loader2 } from 'lucide-vue-next'

interface Comment {
  id: string
  content: string
  created_at: string
  profile: {
    id: string
    username: string
    avatar_url: string
  }
}

const props = defineProps<{
  isOpen: boolean
  ratingId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'comment-added'): void
}>()

const comments = ref<Comment[]>([])
const newComment = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const currentUser = ref<any>(null)

// コメントの取得
const fetchComments = async () => {
  if (!props.ratingId) return

  try {
    isLoading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('sake_rating_comments')
      .select(
        `
        id,
        content,
        created_at,
        profile:profiles(
          id,
          username,
          avatar_url
        )
      `,
      )
      .eq('rating_id', props.ratingId)
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

    const { error: insertError } = await supabase.from('sake_rating_comments').insert({
      rating_id: props.ratingId,
      profile_id: currentUser.value.id,
      content: newComment.value.trim(),
    })

    if (insertError) throw insertError

    // コメント投稿後にコメント数を更新
    const { error: updateError } = await supabase
      .from('sake_flavor_ratings')
      .update({
        comments_count: comments.value.length + 1,
      })
      .eq('id', props.ratingId)

    if (updateError) throw updateError

    newComment.value = ''
    await fetchComments()
    emit('comment-added')
  } catch (e) {
    console.error('Error submitting comment:', e)
    error.value = 'コメントの投稿に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

// タイムスタンプのフォーマット
const formatTimestamp = (timestamp: string): string => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ja })
}

// コメントの削除（自分のコメントのみ）
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
    const { error: updateError } = await supabase
      .from('sake_flavor_ratings')
      .update({
        comments_count: comments.value.length - 1,
      })
      .eq('id', props.ratingId)

    if (updateError) throw updateError

    await fetchComments()
    emit('comment-added')
  } catch (e) {
    console.error('Error deleting comment:', e)
    error.value = 'コメントの削除に失敗しました'
  }
}

// モーダルが開いたときにコメントを取得
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      fetchComments()
      fetchCurrentUser()
    }
  },
)

onMounted(() => {
  if (props.isOpen) {
    fetchComments()
    fetchCurrentUser()
  }
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">コメント</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-500 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- コメントリスト -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-if="isLoading" class="flex justify-center py-4">
          <Loader2 class="w-6 h-6 text-gray-400 animate-spin" />
        </div>

        <div v-else-if="error" class="text-red-500 text-center py-4">
          {{ error }}
        </div>

        <div v-else-if="comments.length === 0" class="text-gray-500 text-center py-4">
          まだコメントはありません
        </div>

        <template v-else>
          <div v-for="comment in comments" :key="comment.id" class="flex space-x-3">
            <!-- ユーザーアバター -->
            <img
              :src="comment.profile.avatar_url"
              :alt="comment.profile.username"
              class="w-8 h-8 rounded-full"
              onerror="this.src='fallback-avatar.png'"
            />

            <!-- コメント内容 -->
            <div class="flex-1">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-gray-900">
                    {{ comment.profile.username }}
                  </span>
                  <span class="text-sm text-gray-500">
                    {{ formatTimestamp(comment.created_at) }}
                  </span>
                </div>
                <p class="text-gray-700">{{ comment.content }}</p>
              </div>

              <!-- 削除ボタン（自分のコメントの場合） -->
              <button
                v-if="currentUser?.id === comment.profile.id"
                @click="deleteComment(comment.id)"
                class="text-xs text-gray-500 hover:text-red-500 mt-1 ml-1"
              >
                削除
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- コメント入力エリア -->
      <div class="border-t p-4">
        <div v-if="!currentUser" class="text-center text-gray-500">
          コメントを投稿するにはログインが必要です
        </div>
        <div v-else class="flex items-end space-x-2">
          <div class="flex-1">
            <textarea
              v-model="newComment"
              rows="2"
              class="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="コメントを入力..."
              :disabled="isSubmitting"
            ></textarea>
          </div>
          <button
            @click="submitComment"
            :disabled="!newComment.trim() || isSubmitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send v-if="!isSubmitting" class="w-5 h-5" />
            <Loader2 v-else class="w-5 h-5 animate-spin" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
