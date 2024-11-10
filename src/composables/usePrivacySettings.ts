import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

export const usePrivacySettings = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const settings = ref({
    showProfile: false,
    id: '',
  })

  // 設定を読み込む
  const loadSettings = async () => {
    try {
      loading.value = true
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('ユーザーが見つかりません')

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, show_profile')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        settings.value = {
          showProfile: data.show_profile,
          id: data.id,
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'エラーが発生しました'
    } finally {
      loading.value = false
    }
  }

  // 設定を更新する
  const updateSettings = async (showProfile: boolean) => {
    try {
      loading.value = true
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('ユーザーが見つかりません')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          show_profile: showProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      settings.value.showProfile = showProfile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'エラーが発生しました'
    } finally {
      loading.value = false
    }
  }

  // アカウントを削除する
  const deleteAccount = async () => {
    try {
      loading.value = true
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('ユーザーが見つかりません')

      // プロフィールの削除
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id)

      if (profileError) throw profileError

      // ユーザーの削除
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) throw deleteError

      // サインアウト
      await supabase.auth.signOut()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'エラーが発生しました'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    deleteAccount,
  }
}
