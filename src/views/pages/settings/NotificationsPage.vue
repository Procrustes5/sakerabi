<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { ArrowLeft, Bell, Heart, MessageSquare, AtSign } from 'lucide-vue-next'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const error = ref<string | null>(null)

interface NotificationSettings {
  notify_on_like: boolean
  notify_on_comment: boolean
  notify_on_reply: boolean
  notify_on_mention: boolean
}

const settings = ref<NotificationSettings>({
  notify_on_like: true,
  notify_on_comment: true,
  notify_on_reply: true,
  notify_on_mention: true,
})

// 設定の読み込み
const loadSettings = async () => {
  try {
    loading.value = true
    error.value = null

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { data, error: fetchError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('profile_id', userData.user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (data) {
      settings.value = {
        notify_on_like: data.notify_on_like,
        notify_on_comment: data.notify_on_comment,
        notify_on_reply: data.notify_on_reply,
        notify_on_mention: data.notify_on_mention,
      }
    } else {
      // 設定が存在しない場合は作成
      const { data: newSettings, error: insertError } = await supabase
        .from('notification_settings')
        .insert({
          profile_id: userData.user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (newSettings) {
        settings.value = {
          notify_on_like: newSettings.notify_on_like,
          notify_on_comment: newSettings.notify_on_comment,
          notify_on_reply: newSettings.notify_on_reply,
          notify_on_mention: newSettings.notify_on_mention,
        }
      }
    }
  } catch (e) {
    console.error('Error loading notification settings:', e)
    error.value = '設定の読み込みに失敗しました'
  } finally {
    loading.value = false
  }
}

// 設定の更新
const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
  try {
    loading.value = true
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    const { error: updateError } = await supabase
      .from('notification_settings')
      .update({ [key]: value })
      .eq('profile_id', userData.user.id)

    if (updateError) throw updateError

    settings.value[key] = value
    toast.success('設定を更新しました')
  } catch (e) {
    console.error('Error updating notification settings:', e)
    toast.error('設定の更新に失敗しました')
    // 更新に失敗した場合は元の値に戻す
    settings.value[key] = !value
  } finally {
    loading.value = false
  }
}

// 戻るボタンの処理
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-6">
    <!-- ヘッダー -->
    <div class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex items-center">
        <button @click="goBack" class="mr-3">
          <ArrowLeft class="w-6 h-6 text-gray-600" />
        </button>
        <h1 class="text-xl font-bold text-gray-900">通知設定</h1>
      </div>
    </div>

    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- 読み込み中の表示 -->
      <div v-if="loading && !settings" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- エラーメッセージ -->
      <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- 通知設定カード -->
        <div class="bg-white rounded-2xl shadow-sm">
          <!-- メインヘッダー -->
          <div class="p-6">
            <div class="flex items-center space-x-3 mb-4">
              <Bell class="w-6 h-6 text-indigo-600" />
              <h2 class="text-lg font-bold text-gray-900">通知設定</h2>
            </div>
            <p class="text-sm text-gray-500">
              受け取る通知の種類を設定できます。必要な通知のみを選択することで、重要な情報を見逃すことなく管理できます。
            </p>
          </div>

          <!-- 設定項目リスト -->
          <div class="divide-y divide-gray-100">
            <!-- いいね通知 -->
            <div class="p-4 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center space-x-3">
                <Heart class="w-5 h-5 text-gray-600" />
                <div>
                  <p class="text-sm font-medium text-gray-900">いいね</p>
                  <p class="text-xs text-gray-500">投稿がいいねされたときに通知を受け取ります</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="settings.notify_on_like"
                  class="sr-only peer"
                  :disabled="loading"
                  @change="updateSettings('notify_on_like', settings.notify_on_like)"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                ></div>
              </label>
            </div>

            <!-- コメント通知 -->
            <div class="p-4 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center space-x-3">
                <MessageSquare class="w-5 h-5 text-gray-600" />
                <div>
                  <p class="text-sm font-medium text-gray-900">コメント</p>
                  <p class="text-xs text-gray-500">
                    投稿にコメントがついたときに通知を受け取ります
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="settings.notify_on_comment"
                  class="sr-only peer"
                  :disabled="loading"
                  @change="updateSettings('notify_on_comment', settings.notify_on_comment)"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                ></div>
              </label>
            </div>

            <!-- 返信通知 -->
            <div class="p-4 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center space-x-3">
                <MessageSquare class="w-5 h-5 text-gray-600" />
                <div>
                  <p class="text-sm font-medium text-gray-900">返信</p>
                  <p class="text-xs text-gray-500">
                    コメントした投稿に新しいコメントがついたときに通知を受け取ります
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="settings.notify_on_reply"
                  class="sr-only peer"
                  :disabled="loading"
                  @change="updateSettings('notify_on_reply', settings.notify_on_reply)"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                ></div>
              </label>
            </div>

            <!-- メンション通知 -->
            <div class="p-4 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center space-x-3">
                <AtSign class="w-5 h-5 text-gray-600" />
                <div>
                  <p class="text-sm font-medium text-gray-900">メンション</p>
                  <p class="text-xs text-gray-500">
                    コメントでメンションされたときに通知を受け取ります
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="settings.notify_on_mention"
                  class="sr-only peer"
                  :disabled="loading"
                  @change="updateSettings('notify_on_mention', settings.notify_on_mention)"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"
                ></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
}
</style>
