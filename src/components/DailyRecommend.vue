<script setup lang="ts">
defineProps<{
  imageUrl: string;
  title: string;
  sakeName: string;
}>();
</script>

<template>
  <div class="aspect-square overflow-hidden rounded-xl shadow-sm bg-white">
    <div class="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600">
      <img
        :src="imageUrl"
        :alt="title"
        class="w-full h-full object-cover"
      >
      <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <h2 class="text-white text-xl font-bold mb-2">{{ title }}</h2>
        <p class="text-white/90 text-sm">{{ sakeName }}</p>
      </div>
    </div>
  </div>
</template>
