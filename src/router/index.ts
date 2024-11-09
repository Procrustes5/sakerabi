import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/pages/HomePage.vue'
import StartPage from '../views/pages/StartPage.vue'
import EventListView from '../views/pages/EventListPage.vue'
import EventCreateView from '../views/pages/EventCreatePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/start',
      name: 'start',
      component: StartPage,
    },
    {
      path: '/events',
      name: 'events',
      component: EventListView,
    },
    {
      path: '/events/create',
      name: 'event-create',
      component: EventCreateView,
    },
    // イベント編集ページを追加する場合
    // {
    //   path: '/events/:id/edit',
    //   name: 'event-edit',
    //   component: () => import('../views/pages/EventEditView.vue'),
    //   props: true
    // },
  ],
})

export default router
