<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { ChevronRight, LogOut } from 'lucide-vue-next'

const router = useRouter()
const profile = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    console.log(user)
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      profile.value = data
    }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/welcome')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow-sm">
      <div class="px-4 py-6">
        <h1 class="text-xl font-semibold text-gray-900">設定</h1>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <!-- プロフィールセクション -->
      <div class="bg-white rounded-2xl shadow-sm mb-6">
        <div class="p-4 flex items-center space-x-4">
          <div v-if="loading" class="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div v-else class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <span class="text-2xl text-indigo-600">{{ profile?.display_name?.charAt(0) || '?' }}</span>
          </div>
          <div class="flex-1">
            <h2 class="font-medium text-gray-900">
              {{ loading ? 'Loading...' : (profile?.display_name || 'Anonymous') }}
            </h2>
            <p class="text-sm text-gray-500">
              {{ loading ? '' : 'プロフィールを編集' }}
            </p>
          </div>
          <ChevronRight class="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <!-- メニューセクション -->
      <div class="bg-white rounded-2xl shadow-sm mb-6 divide-y divide-gray-100">
        <!-- 将来的なメニュー項目はここに追加 -->
      </div>

      <!-- アカウントセクション -->
      <div class="bg-white rounded-2xl shadow-sm">
        <button
          @click="handleLogout"
          class="w-full p-4 flex items-center text-red-600 hover:bg-gray-50 transition-colors duration-200"
        >
          <LogOut class="w-5 h-5 mr-3" />
          <span>ログアウト</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
}
</style>
