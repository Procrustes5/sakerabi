<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Shield,
  UserCircle,
  ArrowLeft
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { usePrivacySettings } from '@/composables/usePrivacySettings'
import { useToast } from '@/composables/useToast' // トースト通知用のコンポーザブル

const router = useRouter()
const showDeleteConfirm = ref(false)
const { settings, loading, error, loadSettings, updateSettings, deleteAccount } = usePrivacySettings()
const toast = useToast()

// 初期設定の読み込み
onMounted(async () => {
  await loadSettings()
})

// 設定変更時の処理
const handleSettingChange = async (checked: boolean) => {
  try {
    await updateSettings(checked)
    toast.success('設定を更新しました')
  } catch (err) {
    toast.error('設定の更新に失敗しました')
  }
}

// アカウント削除確認ダイアログの表示
const showDeleteAccountDialog = () => {
  showDeleteConfirm.value = true
}

// アカウント削除処理
const handleDeleteAccount = async () => {
  try {
    await deleteAccount()
    router.push('/welcome')
  } catch (err) {
    toast.error('アカウントの削除に失敗しました')
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
        <h1 class="text-xl font-bold text-gray-900">プライバシーとセキュリティ</h1>
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

      <div v-else>
        <!-- プライバシー設定セクション -->
        <div class="bg-white rounded-2xl shadow-sm mb-6">
          <div class="p-6">
            <div class="flex items-center mb-4">
              <Shield class="w-5 h-5 text-indigo-600 mr-2" />
              <h2 class="text-lg font-bold text-gray-900">プライバシー設定</h2>
            </div>

            <div class="space-y-6">
              <!-- プロフィール公開設定 -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <UserCircle class="w-5 h-5 text-gray-600" />
                  <div>
                    <p class="text-sm font-medium text-gray-900">プロフィール公開</p>
                    <p class="text-xs text-gray-500">名前と部署情報の公開設定</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="settings.showProfile"
                    @change="e => handleSettingChange(e.target.checked)"
                    class="sr-only peer"
                  >
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer
                            peer-checked:after:translate-x-full peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:border-gray-300 after:border after:rounded-full
                            after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600">
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- データ管理セクション -->
        <div class="bg-white rounded-2xl shadow-sm mb-6">
          <div class="p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">データ管理</h2>
            <div>
              <button
                @click="showDeleteAccountDialog"
                class="w-full py-3 px-4 border border-red-200 rounded-xl text-sm
                       font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                アカウントを削除
              </button>
              <p class="mt-2 text-xs text-gray-500">
                全てのデータが完全に削除されます。この操作は取り消せません
              </p>
            </div>
          </div>
        </div>

        <!-- プライバシーポリシー -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
          <h3 class="text-sm font-medium text-gray-900 mb-2">プライバシーポリシーについて</h3>
          <p class="text-xs text-gray-500 leading-relaxed">
            このアプリは社内の日本酒会のために作られた非商用アプリケーションです。
            収集された情報は社内イベントの運営にのみ使用され、外部への提供は行いません。
            個人情報の取り扱いについては、社内規定および個人情報保護法に準拠して適切に管理いたします。
          </p>
        </div>
      </div>
    </main>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteConfirm"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 class="text-lg font-bold text-gray-900 mb-2">アカウントを削除しますか？</h3>
        <p class="text-sm text-gray-500 mb-6">
          この操作は取り消すことができません。全てのデータが完全に削除されます。
        </p>
        <div class="flex space-x-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm
                   font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            @click="handleDeleteAccount"
            class="flex-1 py-2 px-4 bg-red-600 text-white rounded-xl text-sm
                   font-medium hover:bg-red-700"
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
