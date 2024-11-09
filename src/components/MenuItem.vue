<script setup lang="ts">
import { LucideIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const props = defineProps<{
  icon: LucideIcon;
  title: string;
}>();

const router = useRouter();

const handleClick = () => {
  if (props.title === 'イベント') {
    router.push('/events');
  } else if (props.title === '設定') {
    router.push('/settings');
  }
};
</script>

<template>
  <button
    class="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm
           hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200"
    @click="handleClick"
  >
    <div class="text-indigo-600 mb-2">
      <component :is="icon" class="w-8 h-8" />
    </div>
    <span class="text-sm text-gray-700">{{ title }}</span>
  </button>
</template>

<style scoped>
button:active {
  transform: scale(0.98);
}
</style>
