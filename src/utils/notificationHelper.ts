import { supabase } from '@/utils/supabase'

interface CreateNotificationParams {
  profileId: string
  type: 'like' | 'comment' | 'reply' | 'mention'
  actorId: string
  ratingId: number
  commentId?: string
}

export async function createNotification({
                                           profileId,
                                           type,
                                           actorId,
                                           ratingId,
                                           commentId,
                                         }: CreateNotificationParams) {
  try {
    // 自分自身への通知は作成しない
    if (profileId === actorId) return

    // 通知設定を確認
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    // 設定に基づいて通知を作成するかどうかを判断
    if (settings) {
      const shouldNotify = {
        like: settings.notify_on_like,
        comment: settings.notify_on_comment,
        reply: settings.notify_on_reply,
        mention: settings.notify_on_mention,
      }[type]

      if (!shouldNotify) return
    }

    // 通知の作成
    const { error } = await supabase.from('notifications').insert({
      profile_id: profileId,
      type,
      actor_id: actorId,
      rating_id: ratingId,
      comment_id: commentId,
    })

    if (error) throw error
  } catch (e) {
    console.error('Error creating notification:', e)
  }
}

// いいね時の通知
export async function notifyOnLike(ratingId: number, actorId: string) {
  try {
    // 評価の投稿者を取得
    const { data: rating } = await supabase
      .from('sake_flavor_ratings')
      .select('profile_id')
      .eq('id', ratingId)
      .single()

    if (rating) {
      await createNotification({
        profileId: rating.profile_id,
        type: 'like',
        actorId,
        ratingId,
      })
    }
  } catch (e) {
    console.error('Error in notifyOnLike:', e)
  }
}

// コメント時の通知
export async function notifyOnComment(
  ratingId: number,
  commentId: string,
  actorId: string,
) {
  try {
    // 評価の投稿者とコメントしているユーザーを取得
    const [{ data: rating }, { data: comments }] = await Promise.all([
      supabase
        .from('sake_flavor_ratings')
        .select('profile_id')
        .eq('id', ratingId)
        .single(),
      supabase
        .from('sake_rating_comments')
        .select('profile_id')
        .eq('rating_id', ratingId),
    ])

    if (rating) {
      // 評価の投稿者への通知
      await createNotification({
        profileId: rating.profile_id,
        type: 'comment',
        actorId,
        ratingId,
        commentId,
      })

      // 他のコメント投稿者への通知（重複を除く）
      const commenters = new Set(comments?.map((c) => c.profile_id) || [])
      commenters.delete(actorId) // 自分自身を除外
      commenters.delete(rating.profile_id) // 評価投稿者を除外（既に通知済み）

      for (const commenterId of commenters) {
        await createNotification({
          profileId: commenterId,
          type: 'reply',
          actorId,
          ratingId,
          commentId,
        })
      }
    }
  } catch (e) {
    console.error('Error in notifyOnComment:', e)
  }
}
