import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabase'
import HomePage from '@/views/pages/HomePage.vue'
import WelcomePage from '@/views/pages/WelcomePage.vue'
import EventListView from '@/views/pages/events/EventListPage.vue'
import EventCreateView from '@/views/pages/events/EventCreatePage.vue'
import SettingsPage from '@/views/pages/settings/SettingsPage.vue'
import SecurityPage from '@/views/pages/settings/SecurityPage.vue'
import AuthCallback from '@/components/AuthCallback.vue'
import AccountPage from '@/views/pages/settings/AccountPage.vue'
import HelpPage from '@/views/pages/settings/HelpPage.vue'
import SakeDetail from '@/components/SakeDetail.vue'
import NotificationsPage from '@/views/pages/settings/NotificationsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomePage,
      meta: { requiresUnauth: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback,
      meta: { requiresAuth: false }, // コールバックページは認証チェックをスキップ
    },
    {
      path: '/events',
      name: 'events',
      component: EventListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: () => import('@/views/pages/events/EventDetailPage.vue'),
    },
    {
      path: '/events/create',
      name: 'event-create',
      component: EventCreateView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/edit',
      name: 'event-edit',
      component: () => import('../views/pages/events/EventEditPage.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/sake',
      name: 'sake-list',
      component: () => import('@/views/pages/sake/SakeListPage.vue'),
    },
    {
      path: '/sake/:id',
      name: 'sake-detail',
      component: SakeDetail,
    },
    {
      path: '/sake/add',
      name: 'sake-add',
      component: () => import('@/views/pages/sake/SakeAddPage.vue'),
    },
    {
      path: '/recommend',
      name: 'sake-recommend',
      component: () => import('@/views/pages/sake/SakeRecommendationPage.vue'),
    },
    {
      path: '/favorite',
      name: 'sake-favorite',
      component: () => import('@/views/pages/sake/SakeFavoritePage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/account',
      name: 'account',
      component: AccountPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/security',
      name: 'security',
      component: SecurityPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/help',
      name: 'help',
      component: HelpPage,
      meta: { requiresAuth: false },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // ブラウザの戻る/進むボタンの場合は保存された位置を使用
    if (savedPosition) {
      return savedPosition
    }
    // それ以外の場合は最上部へスクロール
    return { top: 0 }
  },
})

// ナビゲーションガード
router.beforeEach(async (to) => {
  // セッションチェック
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // ルートがログインが必要で、未認証の場合
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'welcome' }
  }

  // /welcomeへのアクセスで認証済みの場合
  if (to.path === '/welcome' && isAuthenticated) {
    return { name: 'home' }
  }

  // ルートパスへの直接アクセスの場合のみリダイレクト
  if (to.path === '/' && !isAuthenticated) {
    return { name: 'welcome' }
  }

  // それ以外の場合は、現在のURLを維持
  return true
})

export default router
