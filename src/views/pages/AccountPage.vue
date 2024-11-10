<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import {
  ArrowLeft,
  UserCircle,
  Camera,
  Settings,
  Shield,
  Bell,
  ChevronRight,
} from 'lucide-vue-next'
import { useProfile } from '@/composables/useProfile'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const showDeleteConfirm = ref(false)

// プロフィール関連の状態管理
const {
  profile,
  loading,
  error,
  loadProfile,
  updateProfile: saveProfile,
  deleteAccount,
} = useProfile()

const editedProfile = ref({
  displayName: '',
  bio: '',
})

// 初期データの読み込み
onMounted(async () => {
  await loadProfile()
  if (profile.value) {
    editedProfile.value = {
      displayName: profile.value.displayName,
      bio: profile.value.bio,
    }
  }
})

// プロフィール画像アップロード
const handleImageUpload = () => {
  fileInput.value?.click()
}

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  try {
    loading.value = true
    const file = input.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Storage にアップロード
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

    if (uploadError) throw uploadError

    // プロフィール更新
    const avatarUrl = `${supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl}`
    await saveProfile({ ...profile.value, avatarUrl })

    toast.success('プロフィール画像を更新しました')
  } catch (err) {
    toast.error('画像のアップロードに失敗しました')
    console.error('Upload error:', err)
  } finally {
    loading.value = false
  }
}

// プロフィール更新
const updateProfile = async () => {
  try {
    loading.value = true
    await saveProfile({
      ...profile.value,
      ...editedProfile.value,
    })
    toast.success('プロフィールを更新しました')
  } catch (err) {
    toast.error('プロフィールの更新に失敗しました')
    console.error('Update error:', err)
  } finally {
    loading.value = false
  }
}

// ログアウト処理
const handleSignOut = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/welcome')
  } catch (err) {
    toast.error('ログアウトに失敗しました')
  }
}

// アカウント削除処理
const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    router.push('/welcome')
  } catch (err) {
    toast.error('アカウントの削除に失敗しました')
  } finally {
    showDeleteConfirm.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-6">
    <!-- ヘッダー -->
    <div class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex items-center">
        <button @click="goBack" class="mr-3">
          <ArrowLeft class="w-6 h-6 text-gray-600" />
        </button>
        <h1 class="text-xl font-bold text-gray-900">アカウント情報</h1>
      </div>
    </div>

    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- 読み込み中の表示 -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- エラーメッセージ -->
      <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- プロフィール画像と基本情報 -->
        <div class="bg-white rounded-2xl shadow-sm">
          <div class="p-6">
            <div class="flex flex-col items-center mb-6">
              <div class="relative mb-4">
                <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                  <img
                    v-if="profile?.avatarUrl"
                    :src="profile?.avatarUrl"
                    :alt="profile?.displayName"
                    class="w-full h-full object-cover"
                  />
                  <UserCircle v-else class="w-full h-full text-gray-400 p-2" />
                </div>
                <button
                  @click="handleImageUpload"
                  class="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"
                >
                  <Camera class="w-4 h-4" />
                </button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onFileSelected"
                />
              </div>
              <h2 class="text-xl font-bold text-gray-900">{{ profile?.displayName }}</h2>
              <p class="text-sm text-gray-500">{{ profile?.email }}</p>
            </div>

            <!-- 基本情報編集フォーム -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                <input
                  v-model="editedProfile.displayName"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-500"
                  placeholder="表示名を入力"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                <textarea
                  v-model="editedProfile.bio"
                  class="w-full h-20 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-500"
                  placeholder="自己紹介を入力"
                ></textarea>
              </div>
              <button
                @click="updateProfile"
                :disabled="loading"
                class="w-full py-2 px-4 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ loading ? '更新中...' : '保存する' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 各種設定リンク -->
        <div class="bg-white rounded-2xl shadow-sm">
          <div class="divide-y divide-gray-100">
            <router-link
              to="/settings"
              class="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <Settings class="w-5 h-5 text-gray-600" />
                <span class="text-sm font-medium text-gray-900">一般設定</span>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </router-link>

            <router-link
              to="/security"
              class="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <Shield class="w-5 h-5 text-gray-600" />
                <span class="text-sm font-medium text-gray-900">プライバシーとセキュリティ</span>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </router-link>

            <router-link
              to="/notifications"
              class="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <Bell class="w-5 h-5 text-gray-600" />
                <span class="text-sm font-medium text-gray-900">通知設定</span>
              </div>
              <ChevronRight class="w-5 h-5 text-gray-400" />
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- 削除確認モーダル -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 class="text-lg font-bold text-gray-900 mb-2">アカウントを削除しますか？</h3>
        <p class="text-sm text-gray-500 mb-6">
          この操作は取り消すことができません。全てのデータが完全に削除されます。
        </p>
        <div class="flex space-x-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            @click="handleDeleteAccount"
            class="flex-1 py-2 px-4 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
            :disabled="loading"
          >
            {{ loading ? '処理中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
}
</style>
