import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Google ログインハンドラー
  const handleGoogleLogin = async () => {
    try {
      loading.value = true
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
    } catch (err) {
      error.value = err instanceof Error ? err.message : '認証エラーが発生しました'
      console.error('Login error:', err)
    } finally {
      loading.value = false
    }
  }

  // 初期化時のセッションチェック
  const initializeAuth = async () => {
    try {
      loading.value = true
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        user.value = session.user
      }
    } catch (err) {
      console.error('Session initialization error:', err)
      error.value = 'セッションの確認に失敗しました'
    } finally {
      loading.value = false
    }
  }

  // セッション状態の監視
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event)
    user.value = session?.user || null
  })

  onMounted(() => {
    initializeAuth()
  })

  return {
    user,
    loading,
    error,
    handleGoogleLogin,
  }
}
