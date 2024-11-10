<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { watch, ref } from 'vue'
import Logo from '@/assets/logo.svg'

const router = useRouter()
const { user, loading, error, handleGoogleLogin } = useAuth()
const isHovered = ref(false)

watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
})

const handleLoginClick = async () => {
  await handleGoogleLogin()
}
</script>

<template>
  <main
    class="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
  >
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        v-for="i in 3"
        :key="i"
        class="absolute blur-3xl opacity-30 animate-blob"
        :class="[
          i === 1 ? 'bg-blue-500 top-0 left-0' : '',
          i === 2 ? 'bg-purple-500 top-1/4 right-0 animation-delay-2000' : '',
          i === 3 ? 'bg-pink-500 bottom-0 left-1/3 animation-delay-4000' : '',
        ]"
        :style="{
          width: '40%',
          height: '40%',
          borderRadius: '50%',
        }"
      />
    </div>

    <div
      class="relative flex flex-col items-center justify-center min-h-screen p-6 backdrop-blur-sm"
    >
      <!-- Logo/Title Section with enhanced animation -->
      <div
        class="text-center mt-40 mb-44 relative transform transition-all duration-700"
        :class="{ 'scale-105': isHovered }"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <div
          class="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-8"
        >
          <div class="flex gap-2 items-center">
            <img
              :src="Logo"
              alt="Sakerabi Logo"
              class="w-12 h-12 relative z-10 drop-shadow-4xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
            />
            <h1
              class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80 tracking-tight"
            >
              sakerabi
            </h1>
          </div>
        </div>

        <p class="text-indigo-100 text-lg tracking-wide animate-fade-in">
          日本酒会の楽しみ方を広げる
        </p>
      </div>

      <!-- Enhanced Login Button -->
      <div class="w-full max-w-sm transform transition-all duration-500 hover:translate-y-[-4px]">
        <button
          @click="handleLoginClick"
          :disabled="loading"
          class="group relative w-full bg-white/10 backdrop-blur-md rounded-2xl py-5 px-8 text-white border border-white/20 font-medium transition-all duration-500 hover:bg-white/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        >
          <!-- Button background animation -->
          <div
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"
          />

          <div class="relative flex items-center justify-center space-x-3">
            <!-- Enhanced Google Icon with glow effect -->
            <div class="relative">
              <div
                class="absolute inset-0 bg-white/20 rounded-full blur group-hover:blur-md transition-all duration-500"
              />
              <svg
                class="relative w-6 h-6 transform group-hover:scale-110 transition-transform duration-500"
                viewBox="0 0 40 40"
              >
                <path
                  d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
                  fill="white"
                  fill-opacity="0.1"
                />
                <path
                  d="M29.6 20.2C29.6 19.4 29.5 18.6 29.4 17.8H20V22.2H25.4C25.1 23.6 24.3 24.8 23.1 25.6V28.5H26.8C28.9 26.5 30.1 23.6 30.1 20.2H29.6Z"
                  fill="#4285F4"
                />
                <path
                  d="M20 30C23 30 25.5 29 27.3 27.2L23.6 24.3C22.6 25 21.3 25.4 19.8 25.4C16.9 25.4 14.5 23.4 13.6 20.5H9.8V23.4C11.6 27.3 15.3 30 19.8 30H20Z"
                  fill="#34A853"
                />
                <path
                  d="M13.6 20.5C13.4 19.8 13.2 19.1 13.2 18.3C13.2 17.5 13.3 16.8 13.6 16.1V13.2H9.8C8.9 14.7 8.4 16.4 8.4 18.2C8.4 20 8.9 21.7 9.8 23.2L13.6 20.5Z"
                  fill="#FBBC05"
                />
                <path
                  d="M20 11.2C21.6 11.2 23.1 11.7 24.2 12.8L27.4 9.6C25.4 7.8 22.9 6.7 20 6.7C15.5 6.7 11.8 9.4 10 13.3L13.8 16.2C14.7 13.3 17.1 11.3 20 11.3V11.2Z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <span class="text-lg font-medium tracking-wide">
              {{ loading ? '読み込み中...' : 'Googleで始める' }}
            </span>
          </div>
        </button>

        <!-- Enhanced Error Message -->
        <div
          v-if="error"
          class="mt-4 text-red-200 text-sm text-center bg-red-500/10 rounded-lg p-4 backdrop-blur-md border border-red-500/20 shadow-lg transform transition-all duration-500"
        >
          {{ error }}
        </div>

        <!-- Enhanced Footer Links -->
        <div class="mt-8 flex justify-center space-x-8">
          <a
            v-for="(link, index) in [
              { text: 'ヘルプ', href: '/help' },
              { text: 'プライバシー', href: '/security' },
            ]"
            :key="index"
            :href="link.href"
            class="group relative text-white/80 text-sm transition-colors duration-300 hover:text-white"
          >
            <span class="relative z-10">{{ link.text }}</span>
            <span
              class="absolute bottom-0 left-0 w-full h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
            />
          </a>
        </div>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
@keyframes blob {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -30px) scale(1.1);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  75% {
    transform: translate(20px, 30px) scale(1.1);
  }
}

.animate-blob {
  animation: blob 20s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

button {
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.98);
  }
}

* {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
</style>
