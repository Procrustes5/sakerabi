import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'

export interface Notification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'mention'
  actor: {
    id: string
    display_name: string
    avatar_url: string
  }
  rating_id: number
  comment_id?: string
  is_read: boolean
  created_at: string
}

export interface NotificationSettings {
  notify_on_like: boolean
  notify_on_comment: boolean
  notify_on_reply: boolean
  notify_on_mention: boolean
}

export function useNotification() {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const settings = ref<NotificationSettings | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // リアルタイム購読
  let subscription: any = null

  // 通知の取得
  const fetchNotifications = async (limit = 20) => {
    try {
      isLoading.value = true
      error.value = null

      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(
          `
          id,
          type,
          actor:profiles!actor_id(
            id,
            display_name,
            avatar_url
          ),
          rating_id,
          comment_id,
          is_read,
          created_at
        `,
        )
        .eq('profile_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError
      notifications.value = data || []

      // 未読カウントの更新
      await updateUnreadCount()
    } catch (e) {
      console.error('Error fetching notifications:', e)
      error.value = '通知の取得に失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // 未読カウントの更新
  const updateUnreadCount = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return

      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userData.user.id)
        .eq('is_read', false)

      if (countError) throw countError
      unreadCount.value = count || 0
    } catch (e) {
      console.error('Error updating unread count:', e)
    }
  }

  // 通知を既読にする
  const markAsRead = async (notificationId?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return

      if (notificationId) {
        // 単一の通知を既読に
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('profile_id', userData.user.id)
      } else {
        // 全ての通知を既読に
        await supabase.rpc('batch_mark_notifications_as_read', {
          profile_id: userData.user.id,
        })
      }

      await updateUnreadCount()
    } catch (e) {
      console.error('Error marking notifications as read:', e)
      error.value = '通知の既読処理に失敗しました'
    }
  }

  // 通知設定の取得
  const fetchSettings = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return

      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('profile_id', userData.user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (!data) {
        // 設定がない場合は作成
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings')
          .insert({
            profile_id: userData.user.id,
          })
          .select()
          .single()

        if (insertError) throw insertError
        settings.value = newSettings
      } else {
        settings.value = data
      }
    } catch (e) {
      console.error('Error fetching notification settings:', e)
      error.value = '通知設定の取得に失敗しました'
    }
  }

  // 通知設定の更新
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) return

      const { data, error: updateError } = await supabase
        .from('notification_settings')
        .update(newSettings)
        .eq('profile_id', userData.user.id)
        .select()
        .single()

      if (updateError) throw updateError
      settings.value = data
    } catch (e) {
      console.error('Error updating notification settings:', e)
      error.value = '通知設定の更新に失敗しました'
    }
  }

  // リアルタイム通知の購読
  const subscribeToNotifications = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return

    subscription = supabase
      .channel('notification_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userData.user.id}`,
        },
        async (payload) => {
          // 新しい通知を配列の先頭に追加
          const { data, error } = await supabase
            .from('notifications')
            .select(
              `
              id,
              type,
              actor:profiles!actor_id(
                id,
                display_name,
                avatar_url
              ),
              rating_id,
              comment_id,
              is_read,
              created_at
            `,
            )
            .eq('id', payload.new.id)
            .single()

          if (!error && data) {
            notifications.value.unshift(data)
            unreadCount.value++
          }
        },
      )
      .subscribe()
  }

  // コンポーネントのマウント時に実行
  onMounted(() => {
    fetchNotifications()
    fetchSettings()
    subscribeToNotifications()
  })

  // コンポーネントのアンマウント時にクリーンアップ
  onUnmounted(() => {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  })

  return {
    notifications,
    unreadCount,
    settings,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    updateSettings,
  }
}
