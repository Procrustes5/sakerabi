<script setup lang="ts">
import { Calendar } from 'lucide-vue-next';

defineProps<{
  title: string;
  eventName: string;
  dateTime: string;
}>();
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-4">
      <div class="flex items-center space-x-4">
        <div class="bg-indigo-100 p-3 rounded-lg">
          <Calendar class="w-6 h-6 text-indigo-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg text-gray-700 font-semibold">{{ title }}</h3>
          <p class="text-sm text-gray-600">{{ eventName }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ dateTime }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
