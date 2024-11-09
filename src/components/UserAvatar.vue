<script setup lang="ts">
import { computed, ref } from 'vue'

const colors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
] as const;

interface Props {
  image?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

// 画像の読み込みステータスを管理
const imageLoadError = ref(false);

const getInitials = (name: string): string => {
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// ユーザー名から一貫した色を生成
const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const handleImageError = () => {
  imageLoadError.value = true;
};

const initials = getInitials(props.name);
const bgColor = getColorFromName(props.name);

// 画像を表示すべきかどうかを判定
const shouldShowImage = computed(() => props.image && !imageLoadError.value);
</script>

<template>
  <div :class="[sizeClasses[size], 'relative rounded-full overflow-hidden']">
    <template v-if="shouldShowImage">
      <img
        :src="image"
        :alt="name"
        class="w-full h-full object-cover"
        @error="handleImageError"
      >
    </template>
    <div
      v-else
      :class="[
        bgColor,
        'w-full h-full flex items-center justify-center text-white font-medium'
      ]"
    >
      {{ initials }}
    </div>
  </div>
</template>
