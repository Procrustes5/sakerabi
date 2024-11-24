<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Bell, Search, X, ExternalLink } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Logo from '../assets/logo.svg'
import { useNotification } from '@/composables/useNotification'
import SakeSearchModal from '@/components/modals/SakeSearchModal.vue'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

const router = useRouter()
const isScrolled = ref(false)
const isSearchModalOpen = ref(false)
const isNotificationDrawerOpen = ref(false)

// 通知機能の使用
const { notifications, unreadCount, markAsRead, fetchNotifications, isLoading } = useNotification()

// 通知の種類に応じたメッセージを生成
const getNotificationMessage = (notification: any) => {
  const actorName = notification.actor.display_name
  switch (notification.type) {
    case 'like':
      return `${actorName}さんがあなたの投稿にいいねしました`
    case 'comment':
      return `${actorName}さんがあなたの投稿にコメントしました`
    case 'reply':
      return `${actorName}さんがコメントを追加しました`
    case 'mention':
      return `${actorName}さんがあなたをメンションしました`
    default:
      return ''
  }
}

// 通知をクリックした時の処理
const handleNotificationClick = async (notification: any) => {
  // 通知を既読にする
  await markAsRead(notification.id)

  // 評価詳細ページに遷移
  router.push(`/ratings/${notification.rating_id}`)
  isNotificationDrawerOpen.value = false
}

// body要素のスクロールを制御する
const toggleScrollLock = (lock: boolean) => {
  if (lock) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none' // モバイルでのスクロールも防ぐ
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
}

// 通知ドロワーを開く（スクロールロックを追加）
const openNotificationDrawer = async () => {
  isNotificationDrawerOpen.value = true
  toggleScrollLock(true)
  await markAsRead()
}

// 通知ドロワーを閉じる（スクロールロックを解除）
const closeNotificationDrawer = () => {
  isNotificationDrawerOpen.value = false
  toggleScrollLock(false)
}

// コンポーネントのアンマウント時にスクロールロックを確実に解除
onUnmounted(() => {
  toggleScrollLock(false)
})

// スクロール位置の監視
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      isScrolled.value = window.scrollY > 10
    })
  }
})

const handleClick = () => {
  router.push('/')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 transition-all duration-300"
    :class="[isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent']"
  >
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- ロゴ部分 -->
        <div class="flex items-center space-x-2 cursor-pointer" @click="handleClick">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              :src="Logo"
              alt="Sakerabi Logo"
              class="w-8 h-8 text-white transform hover:scale-110 transition-transform duration-300"
            />
          </div>
          <h1
            class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            sakerabi
          </h1>
        </div>

        <!-- 右側のアクション -->
        <div class="flex items-center space-x-4">
          <button
            @click="isSearchModalOpen = true"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <Search class="w-5 h-5 text-gray-600" />
          </button>

          <button
            @click="openNotificationDrawer"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 relative"
          >
            <Bell class="w-5 h-5 text-gray-600" />
            <!-- 通知バッジ -->
            <span
              v-if="unreadCount > 0"
              class="absolute top-2 right-2 flex items-center justify-center"
            >
              <span class="animate-ping absolute h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
              <span class="relative rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 検索モーダル -->
    <SakeSearchModal
      :is-open="isSearchModalOpen"
      :on-close="() => { isSearchModalOpen = false }"
    />
  </header>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isNotificationDrawerOpen"
      class="fixed inset-0 bg-black/25 z-50 overflow-hidden"
      @click="closeNotificationDrawer"
    >
      <Transition
        enter-active-class="transform transition ease-out duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transform transition ease-in duration-200"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="isNotificationDrawerOpen"
          class="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl flex flex-col"
          @click.stop
        >
          <!-- ドロワーヘッダー（固定） -->
          <div class="flex items-center justify-between p-4 border-b bg-white">
            <h2 class="text-lg font-semibold text-gray-900">通知</h2>
            <button
              @click="closeNotificationDrawer"
              class="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <!-- スクロール可能な通知リストエリア -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <div v-if="isLoading" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>

            <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-12">
              <Bell class="w-12 h-12 text-indigo-300 mb-4" />
              <p class="text-gray-500">通知はありません</p>
            </div>

            <div v-else class="divide-y">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                :class="{ 'bg-blue-50/50': !notification.is_read }"
              >
                <div class="flex items-start space-x-3">
                  <img
                    :src="notification.actor.avatar_url"
                    :alt="notification.actor.display_name"
                    class="w-10 h-10 rounded-full"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">
                      {{ getNotificationMessage(notification) }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ formatTimestamp(new Date(notification.created_at)) }}
                    </p>
                  </div>
                  <ExternalLink class="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <!-- オプション: 下部に固定のアクションエリアを追加する場合 -->
          <div class="p-4 border-t bg-white">
            <button
              @click="markAsRead()"
              class="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              すべて既読にする
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* iOSでの慣性スクロールを有効にする */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* ドロワーがオープンの時の背景のスクロール防止 */
:root {
  overflow: hidden;
  position: relative;
  height: 100%;
}

/* セーフエリアを考慮したパディング */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .notification-drawer {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
