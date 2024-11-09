import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabase'
import HomePage from '../views/pages/HomePage.vue'
import WelcomePage from '../views/pages/WelcomePage.vue'
import EventListView from '../views/pages/EventListPage.vue'
import EventCreateView from '../views/pages/EventCreatePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { requiresAuth: true }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomePage,
      meta: { requiresUnauth: true }
    },
    {
      path: '/events',
      name: 'events',
      component: EventListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/events/create',
      name: 'event-create',
      component: EventCreateView,
      meta: { requiresAuth: true }
    },
    {
      path: '/events/:id/edit',
      name: 'event-edit',
      component: () => import('../views/pages/EventEditPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
  ],
})

// ナビゲーションガード
// router.beforeEach(async (to) => {
//   // 現在のセッションを取得
//   const { data: { session } } = await supabase.auth.getSession()
//   const isAuthenticated = !!session
//
//   // 認証が必要なルートに未認証でアクセスした場合
//   if (to.meta.requiresAuth && !isAuthenticated) {
//     return { name: 'welcome' }
//   }
//
//   // 未認証用ルートに認証済みでアクセスした場合
//   if (to.meta.requiresUnauth && isAuthenticated) {
//     return { name: 'home' }
//   }
//
//   // ルートパスにアクセスした場合の振り分け
//   if (to.path === '/' && !isAuthenticated) {
//     return { name: 'welcome' }
//   }
// })

export default router
