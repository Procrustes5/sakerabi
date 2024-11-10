<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import {
  LogOut,
  Settings,
  Bell,
  Shield,
  User,
  HelpCircle,
  ChevronRight,
  UserCircle,
} from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'
import { useToast } from '@/composables/useToast'
import { useProfile } from '@/composables/useProfile'

const router = useRouter()
const { profile, loading: profileLoading, loadProfile } = useProfile()
const loading = ref(true)
const toast = useToast()

const menuItems = [
  {
    icon: User,
    label: 'アカウント情報',
    description: '個人情報の確認と編集',
    route: '/account',
  },
  {
    icon: Bell,
    label: '通知設定',
    description: '通知の管理',
    route: '/notifications',
  },
  {
    icon: Shield,
    label: 'プライバシーとセキュリティ',
    description: 'セキュリティ設定の管理',
    route: '/security',
  },
  {
    icon: HelpCircle,
    label: 'ヘルプとサポート',
    description: 'FAQ・お問い合わせ',
    route: '/help',
  },
]

onMounted(async () => {
  try {
    await loadProfile()
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    toast.success('ログアウトしました。')
    router.push('/welcome')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const navigateToMenu = (route: string) => {
  router.push(route)
}

const getInitial = (name: string) => {
  return name ? name[0].toUpperCase() : 'A'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- プロフィールカード -->
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div class="flex items-center space-x-4">
          <!-- プロフィールアバター -->
          <div
            v-if="loading || profileLoading"
            class="w-20 h-20 bg-gray-200 rounded-full animate-pulse"
          />
          <div v-else class="relative w-20 h-20">
            <div
              v-if="profile?.avatarUrl"
              class="w-full h-full rounded-full overflow-hidden bg-gray-100"
            >
              <img
                :src="profile.avatarUrl"
                :alt="profile.displayName"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center"
            >
              <span class="text-3xl font-bold text-white">
                {{ getInitial(profile.displayName) }}
              </span>
            </div>
          </div>

          <!-- プロフィール情報 -->
          <div class="flex-1">
            <h1 class="text-xl font-bold text-gray-900">
              {{ loading || profileLoading ? 'Loading...' : profile?.displayName }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ loading || profileLoading ? '' : profile?.email }}
            </p>
            <div class="mt-2 flex items-center">
              <div class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span class="text-xs text-gray-500">
                  {{
                    profile?.provider
                      ? profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)
                      : 'Google'
                  }}でログイン中
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最終ログイン情報 -->
        <div class="mt-6 pt-6 border-t border-gray-100">
          <div class="text-sm text-gray-500">
            最終ログイン:
            {{ loading ? '' : formatDate(profile?.updatedAt || new Date().toISOString()) }}
          </div>
        </div>
      </div>

      <!-- メニュー項目 -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          @click="navigateToMenu(item.route)"
        >
          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-4">
            <component :is="item.icon" class="w-5 h-5 text-indigo-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-900">
              {{ item.label }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ item.description }}
            </p>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <!-- ログアウトボタン -->
      <div class="bg-white rounded-2xl shadow-sm">
        <button
          @click="handleLogout"
          class="w-full p-4 flex items-center justify-center text-red-600 hover:bg-gray-50 transition-colors duration-200"
        >
          <LogOut class="w-5 h-5 mr-2" />
          <span class="font-medium">ログアウト</span>
        </button>
      </div>

      <!-- アプリバージョン -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-400">アプリバージョン 1.0.0</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
}
</style>
