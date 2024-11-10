import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import type { User } from '@supabase/supabase-js'

// 環境変数からリダイレクトURLのベースを取得
const BASE_URL = import.meta.env.VITE_APP_URL || window.location.origin

export const useAuth = () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const createProfile = async (user: User) => {
    try {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          user_id: user.id,
          display_name: user.user_metadata.full_name || 'Anonymous',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          show_profile: true
        },
        {
          onConflict: 'id'
        }
      )

      if (profileError) throw profileError
    } catch (err) {
      console.error('Profile creation error:', err)
      throw err
    }
  }

  const checkAndCreateProfile = async (user: User) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (!existingProfile) {
        await createProfile(user)
      }
    } catch (err) {
      console.error('Profile check error:', err)
      throw err
    }
  }

  const handleGoogleLogin = async () => {
    try {
      loading.value = true
      error.value = null

      console.log('Redirecting to:', `${BASE_URL}/`) // デバッグ用

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${BASE_URL}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (authError) throw authError

    } catch (err) {
      error.value = err instanceof Error ? err.message : '認証エラーが発生しました'
      console.error('Login error:', err) // デバッグ用
    } finally {
      loading.value = false
    }
  }

  // セッション状態の監視とプロフィール作成
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event) // デバッグ用
    const currentUser = session?.user
    user.value = currentUser!

    if (event === 'SIGNED_IN' && currentUser) {
      try {
        await checkAndCreateProfile(currentUser)
      } catch (err) {
        console.error('Error in auth state change:', err)
        error.value = 'プロフィールの作成に失敗しました'
      }
    }
  })

  // 初期化時に既存のセッションをチェック
  onMounted(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user
        await checkAndCreateProfile(session.user)
      }
    } catch (err) {
      console.error('Session check error:', err)
      error.value = 'セッションの確認に失敗しました'
    }
  })

  return {
    user,
    loading,
    error,
    handleGoogleLogin
  }
}
