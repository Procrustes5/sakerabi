<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { ArrowLeft, Star, Building2, MapPin, Droplets } from 'lucide-vue-next'
import FlavorRating from './FlavorRating.vue'

// 最小限のインターフェース定義
interface SakeDetail {
  id: number
  name: string
  brewery?: {
    id?: number
    name?: string
    area?: {
      id?: number
      name?: string
    }
  }
  flavor_chart?: {
    f1_hanayaka?: number
    f2_houjun?: number
    f3_juukou?: number
    f4_odayaka?: number
    f5_dry?: number
    f6_keiikai?: number
  }
}

const route = useRoute()
const router = useRouter()
const sake = ref<SakeDetail | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

const fetchSakeDetail = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(
        `
        id,
        name,
        brewery:brewery_id (
          id,
          name,
          area:area_id (
            id,
            name
          )
        ),
        flavor_chart:flavor_charts!brand_id (
          f1_hanayaka,
          f2_houjun,
          f3_juukou,
          f4_odayaka,
          f5_dry,
          f6_keiikai
        )
      `,
      )
      .eq('id', route.params.id)
      .single()

    if (error) throw error

    // 最低限name属性があることを確認
    if (!data?.name) {
      throw new Error('日本酒の名前が取得できませんでした')
    }

    sake.value = data
  } catch (error) {
    console.error('Error fetching sake details:', error)
    errorMessage.value = '日本酒の情報の取得に失敗しました'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSakeDetail()
})

// フレーバーチャートの値を安全に取得するヘルパー関数
const getFlavorValue = (key: string): number => {
  return sake.value?.flavor_chart?.[key as keyof Required<NonNullable<SakeDetail['flavor_chart']>>] ?? 0
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-10">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <button
            @click="router.back()"
            class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft class="w-6 h-6 text-gray-600" />
          </button>
          <button class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Star class="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="pt-20 pb-16">
      <div v-if="isLoading" class="flex items-center justify-center min-h-[60vh]">
        <div class="flex flex-col items-center gap-2">
          <div
            class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"
          ></div>
          <div class="text-gray-600">読み込み中...</div>
        </div>
      </div>

      <div v-else-if="errorMessage" class="p-4">
        <div class="bg-red-50 text-red-600 rounded-lg p-4 text-center">
          {{ errorMessage }}
        </div>
      </div>

      <div v-else-if="sake" class="max-w-7xl mx-auto px-4">
        <!-- 基本情報 -->
        <div class="space-y-6 mb-8">
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ sake.name }}</h1>
            <!-- 蔵元情報が存在する場合のみ表示 -->
            <div v-if="sake.brewery" class="space-y-3">
              <div v-if="sake.brewery.name" class="flex items-center gap-2 text-gray-600">
                <Building2 class="w-5 h-5" />
                <span>{{ sake.brewery.name }}</span>
              </div>
              <div v-if="sake.brewery.area?.name" class="flex items-center gap-2 text-gray-600">
                <MapPin class="w-5 h-5" />
                <span>{{ sake.brewery.area.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- フレーバーチャートが存在する場合のみ表示 -->
        <div v-if="sake.flavor_chart" class="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div class="flex items-center gap-2 mb-6">
            <Droplets class="w-5 h-5 text-indigo-500" />
            <h3 class="text-lg font-medium text-gray-900">味わいチャート</h3>
          </div>

          <!-- 六角形のチャート -->
          <div class="flex justify-center mb-12">
            <FlavorRating :values="sake.flavor_chart" :size="280" />
          </div>

          <!-- バーチャート -->
          <div class="grid grid-cols-2 gap-4">
            <div
              v-for="flavor in [
                { key: 'f1_hanayaka', name: '華やか' },
                { key: 'f2_houjun', name: '芳醇' },
                { key: 'f3_juukou', name: '重厚' },
                { key: 'f4_odayaka', name: '穏やか' },
                { key: 'f5_dry', name: 'ドライ' },
                { key: 'f6_keiikai', name: '軽快' },
              ]"
              :key="flavor.key"
              class="bg-gray-50 rounded-xl p-4"
            >
              <p class="text-sm text-gray-500 mb-1">{{ flavor.name }}</p>
              <div class="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-300"
                  :style="{
                    width: `${Math.floor(getFlavorValue(flavor.key) * 500) / 100 * 20}%`,
                  }"
                />
              </div>
              <p class="text-right text-sm text-gray-600 mt-1">
                {{ Math.floor(getFlavorValue(flavor.key) * 500) / 100 }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
