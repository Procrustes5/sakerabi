<!-- FlavorChart.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  values: {
    f1_hanayaka: number
    f2_houjun: number
    f3_juukou: number
    f4_odayaka: number
    f5_dry: number
    f6_keiikai: number
  }
  editable?: boolean
  size?: number
  onChange?: (key: string, value: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  size: 300,
})

const emit = defineEmits<{
  (e: 'update:values', values: Props['values']): void
}>()

const CENTER_X = 150
const CENTER_Y = 150
const RADIUS = 120
const LABELS = [
  { key: 'f1_hanayaka', label: '華やか' },
  { key: 'f2_houjun', label: '豊潤' },
  { key: 'f3_juukou', label: '重厚' },
  { key: 'f4_odayaka', label: '穏やか' },
  { key: 'f5_dry', label: 'ドライ' },
  { key: 'f6_keiikai', label: '軽快' },
]

// 各頂点の座標を計算
const points = computed(() => {
  return LABELS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
    const value = props.values[LABELS[i].key as keyof Props['values']] / 5
    const x = CENTER_X + Math.cos(angle) * RADIUS * value
    const y = CENTER_Y + Math.sin(angle) * RADIUS * value
    return { x, y }
  })
})

// SVGのパスを生成
const path = computed(() => {
  return (
    points.value
      .map((point, i) => {
        return `${i === 0 ? 'M' : 'L'} ${point.x},${point.y}`
      })
      .join(' ') + ' Z'
  )
})

// グリッドラインのパスを生成
const gridPaths = computed(() => {
  return [0.2, 0.4, 0.6, 0.8, 1].map((scale) => {
    const gridPoints = LABELS.map((_, i) => {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
      const x = CENTER_X + Math.cos(angle) * RADIUS * scale
      const y = CENTER_Y + Math.sin(angle) * RADIUS * scale
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    return gridPoints.join(' ') + ' Z'
  })
})

// スライダーでの値の更新
const updateSliderValue = (key: keyof Props['values'], value: number) => {
  if (!props.editable) return
  const newValues = { ...props.values, [key]: value }
  emit('update:values', newValues)
}
</script>

<template>
  <div class="flavor-chart">
    <!-- グラフ表示部分 -->
    <div class="relative">
      <svg :width="size" :height="size" viewBox="0 0 300 300" class="touch-none">
        <!-- グリッドライン -->
        <path
          v-for="(gridPath, i) in gridPaths"
          :key="i"
          :d="gridPath"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="1"
        />

        <!-- 軸線 -->
        <line
          v-for="(_, i) in LABELS"
          :key="i"
          :x1="CENTER_X"
          :y1="CENTER_Y"
          :x2="CENTER_X + Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2) * RADIUS"
          :y2="CENTER_Y + Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2) * RADIUS"
          stroke="#e5e7eb"
          stroke-width="1"
        />

        <!-- フレーバーチャート本体 -->
        <path
          :d="path"
          fill="rgba(99, 102, 241, 0.2)"
          stroke="rgb(99, 102, 241)"
          stroke-width="2"
        />

        <!-- 頂点 -->
        <circle
          v-for="(point, i) in points"
          :key="i"
          :cx="point.x"
          :cy="point.y"
          r="4"
          fill="white"
          stroke="rgb(99, 102, 241)"
          stroke-width="2"
        />
      </svg>

      <!-- ラベル -->
      <div
        v-for="(label, i) in LABELS"
        :key="label.key"
        class="absolute transform -translate-x-1/2 -translate-y-1/2 text-sm text-gray-600"
        :style="{
          left: `${CENTER_X + Math.cos((Math.PI * 2 * i) / 6 - Math.PI / 2) * (RADIUS + 25)}px`,
          top: `${CENTER_Y + Math.sin((Math.PI * 2 * i) / 6 - Math.PI / 2) * (RADIUS + 25)}px`,
        }"
      >
        {{ label.label }}
      </div>
    </div>

    <!-- スライダーコントロール部分 -->
    <div class="sliders-container mt-8" v-if="editable">
      <div v-for="label in LABELS" :key="label.key" class="slider-item mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-500">{{ label.label }}</span>
          <span class="text-sm text-gray-500">{{
            values[label.key as keyof Props['values']]
          }}</span>
        </div>
        <input
          type="range"
          :value="values[label.key as keyof Props['values']]"
          min="0"
          max="5"
          step="0.1"
          @input="
            (e) =>
              updateSliderValue(
                label.key as keyof Props['values'],
                parseFloat((e.target as HTMLInputElement).value),
              )
          "
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.flavor-chart {
  @apply max-w-xl mx-auto p-4;
}

.slider-item input[type='range'] {
  @apply accent-indigo-600;
}

.slider-item input[type='range']::-webkit-slider-thumb {
  @apply w-4 h-4 appearance-none bg-indigo-600 rounded-full cursor-pointer;
}

.slider-item input[type='range']::-moz-range-thumb {
  @apply w-4 h-4 bg-indigo-600 border-none rounded-full cursor-pointer;
}
</style>
