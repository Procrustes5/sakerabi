import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string | null
  displayName: string
  bio: string
  avatarUrl: string | null
  updatedAt: string
}

export const useProfile = () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 現在のユーザーを取得
  const getCurrentUser = async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
  }

  // プロフィールの読み込み
  const loadProfile = async () => {
    try {
      loading.value = true
      error.value = null

      const user = await getCurrentUser()
      if (!user) {
        throw new Error('ユーザーが見つかりません')
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') { // データが見つからない場合
          // 初期プロフィールを作成
          return await createInitialProfile(user)
        }
        throw profileError
      }

      // スネークケースからキャメルケースに変換
      profile.value = {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        bio: data.bio || '',
        avatarUrl: data.avatar_url,
        updatedAt: data.updated_at
      }

    } catch (err) {
      console.error('Profile loading error:', err)
      error.value = 'プロフィールの読み込みに失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 初期プロフィールの作成
  const createInitialProfile = async (user: User) => {
    const initialProfile = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || 'Anonymous',
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: '',
      updated_at: new Date().toISOString()
    }

    const { data, error: createError } = await supabase
      .from('profiles')
      .insert(initialProfile)
      .select()
      .single()

    if (createError) throw createError

    profile.value = {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      updatedAt: data.updated_at
    }

    return profile.value
  }

  // プロフィールの更新
  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      loading.value = true
      error.value = null

      const user = await getCurrentUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      // キャメルケースからスネークケースに変換
      const profileData = {
        display_name: updatedProfile.displayName,
        bio: updatedProfile.bio,
        avatar_url: updatedProfile.avatarUrl,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // 更新されたプロフィールを設定
      profile.value = {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        updatedAt: data.updated_at
      }

    } catch (err) {
      console.error('Profile update error:', err)
      error.value = 'プロフィールの更新に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  // アカウントの削除
  const deleteAccount = async () => {
    try {
      loading.value = true
      error.value = null

      const user = await getCurrentUser()
      if (!user) throw new Error('ユーザーが見つかりません')

      // プロフィール画像の削除
      if (profile.value?.avatarUrl) {
        const fileName = profile.value.avatarUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('avatars')
            .remove([fileName])
        }
      }

      // プロフィールの削除
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (deleteProfileError) throw deleteProfileError

      // ユーザーアカウントの削除
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteUserError) throw deleteUserError

      profile.value = null

    } catch (err) {
      console.error('Account deletion error:', err)
      error.value = 'アカウントの削除に失敗しました'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    deleteAccount,
  }
}
