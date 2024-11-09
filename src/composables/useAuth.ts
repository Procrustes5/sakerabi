import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      loading.value = true
      error.value = null
      console.log(window.location.origin)
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (authError) throw authError

      // ログイン成功後、プロフィールを作成
      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          user_id: data.user.id,
          display_name: data.user.user_metadata.full_name || 'Anonymous',
          created_at: new Date().toISOString(),
        })

        if (profileError) throw profileError
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '認証エラーが発生しました'
    } finally {
      loading.value = false
    }
  }

  // セッション状態の監視
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
  })

  return {
    user,
    loading,
    error,
    handleGoogleLogin,
  }
}
