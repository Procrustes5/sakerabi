<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './utils/supabase'
import ToastContainer from '@/components/ToastContainer.vue'
import SakeSearchModal from '@/components/modals/SakeSearchModal.vue'
import { useSearchModalStore } from '@/stores/useSearchModalStore'

const router = useRouter()
const searchModalStore = useSearchModalStore()

onMounted(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      router.push('/welcome')
    } else if (event === 'SIGNED_IN' && router.currentRoute.value.path === '/welcome') {
      router.push('/')
    }
  })
})
</script>

<template>
  <RouterView />
  <ToastContainer />
  <SakeSearchModal :is-open="searchModalStore.isOpen" :on-close="searchModalStore.close" />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;
    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
