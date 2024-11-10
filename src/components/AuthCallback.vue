<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'
import type { User } from '@supabase/supabase-js'

const router = useRouter()
const route = useRoute()
const error = ref<string | null>(null)

// プロフィール作成関数
const createOrUpdateProfile = async (currentUser: User): Promise<boolean> => {
  console.log('Creating/Updating profile for user:', currentUser.id)

  try {
    const { data, error: profileError } = await supabase.from('profiles').upsert(
      {
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.user_metadata?.full_name || 'Anonymous',
        avatar_url: currentUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      },
    )

    if (profileError) {
      console.error('Profile creation/update failed:', profileError)
      throw profileError
    }

    console.log('Profile created/updated successfully:', data)
    return true
  } catch (err) {
    console.error('Error in createOrUpdateProfile:', err)
    throw err
  }
}

onMounted(async () => {
  try {
    // 現在のセッションを取得
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) throw sessionError

    if (!session?.user) {
      throw new Error('セッションが見つかりません')
    }

    // プロフィールを作成
    await createOrUpdateProfile(session.user)

    // URLパラメータからリダイレクト先を取得
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('redirect') || '/'

    // 成功したらリダイレクト
    router.push(redirectPath)
  } catch (err) {
    console.error('Callback error:', err)
    error.value = 'エラーが発生しました。もう一度お試しください。'
    // エラーの場合はwelcomeページに戻す
    setTimeout(() => {
      router.push('/welcome')
    }, 3000)
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div v-if="error" class="text-red-500">
      {{ error }}
    </div>
    <div v-else class="text-gray-600">認証処理中...</div>
  </div>
</template>
