import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabase'
import HomePage from '@/views/pages/HomePage.vue'
import WelcomePage from '@/views/pages/WelcomePage.vue'
import EventListView from '@/views/pages/EventListPage.vue'
import EventCreateView from '@/views/pages/EventCreatePage.vue'
import SettingsPage from '@/views/pages/SettingsPage.vue'
import SecurityPage from '@/views/pages/SecurityPage.vue'
import AuthCallback from '@/components/AuthCallback.vue'

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
      path: '/events/create',
      name: 'event-create',
      component: EventCreateView,
      meta: { requiresAuth: true },
    },
    {
      path: '/events/:id/edit',
      name: 'event-edit',
      component: () => import('../views/pages/EventEditPage.vue'),
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/security',
      name: 'security',
      component: SecurityPage,
      meta: { requiresAuth: false },
    },
  ],
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
