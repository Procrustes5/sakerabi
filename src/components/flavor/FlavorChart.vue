<script setup lang="ts">
import type { FlavorChart } from '@/types/sake'
import { FLAVOR_LABELS } from '@/constants/flavorLabels'
import { computed } from 'vue'
import { AlertCircle } from 'lucide-vue-next'

interface Props {
  data: FlavorChart & { brand_id?: number }
}

const props = defineProps<Props>()

// brand_id を除外したデータを作成
const flavorData = computed(() => {
  const { brand_id, ...flavors } = props.data
  return flavors
})

// すべての値が empty かどうかをチェック
const isAllEmpty = computed(() => {
  return Object.values(flavorData.value).every((value) => !value)
})
</script>

<template>
  <div class="bg-white/90 p-3 rounded-lg shadow-sm backdrop-blur-sm">
    <!-- 評価が存在する場合 -->
    <div v-if="!isAllEmpty" class="text-xs space-y-1">
      <div
        v-for="(label, key) in FLAVOR_LABELS"
        :key="key"
        class="flex items-center justify-between gap-2"
      >
        <span class="text-gray-600">{{ label }}:</span>
        <div class="flex">
          <div
            v-for="n in 5"
            :key="n"
            class="w-3 h-3 rounded-full"
            :class="n <= flavorData[key] * 5 ? 'bg-indigo-500' : 'bg-gray-200'"
          ></div>
        </div>
      </div>
    </div>

    <!-- 評価が存在しない場合 -->
    <div v-else class="flex items-center justify-center p-4 text-sm text-gray-500 space-x-2">
      <AlertCircle class="w-5 h-5" />
      <span>まだ評価がありません</span>
    </div>
  </div>
</template>
