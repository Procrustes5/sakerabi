<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { ArrowLeft, Star, Building2, MapPin, Droplets } from 'lucide-vue-next'
import FlavorRating from './FlavorRating.vue'

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
const isFavorite = ref(false)
const isUpdatingFavorite = ref(false)

// プロフィール情報を取得
const getCurrentProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', session.user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

// お気に入り状態を取得
const fetchFavoriteStatus = async () => {
  try {
    const profile = await getCurrentProfile()
    if (!profile) return

    const { data, error } = await supabase
      .from('favorite_brands')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('brand_id', route.params.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 は結果が見つからない場合のエラー
    isFavorite.value = !!data
  } catch (error) {
    console.error('Error fetching favorite status:', error)
  }
}

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

    if (!data?.name) {
      throw new Error('日本酒の名前が取得できませんでした')
    }

    sake.value = data
    // お気に入り状態を取得
    await fetchFavoriteStatus()
  } catch (error) {
    console.error('Error fetching sake details:', error)
    errorMessage.value = '日本酒の情報の取得に失敗しました'
  } finally {
    isLoading.value = false
  }
}

// お気に入りの切り替え
const toggleFavorite = async () => {
  try {
    isUpdatingFavorite.value = true
    const profile = await getCurrentProfile()
    if (!profile) {
      // プロフィールが存在しない場合はログインページへリダイレクト
      router.push('/login')
      return
    }

    if (isFavorite.value) {
      // お気に入りから削除
      const { error } = await supabase
        .from('favorite_brands')
        .delete()
        .eq('profile_id', profile.id)
        .eq('brand_id', route.params.id)

      if (error) throw error
    } else {
      // お気に入りに追加
      const { error } = await supabase.from('favorite_brands').insert({
        profile_id: profile.id,
        brand_id: route.params.id,
      })

      if (error) throw error
    }

    // お気に入り状態を反転
    isFavorite.value = !isFavorite.value
  } catch (error) {
    console.error('Error updating favorite:', error)
    errorMessage.value = 'お気に入りの更新に失敗しました'
  } finally {
    isUpdatingFavorite.value = false
  }
}

onMounted(() => {
  fetchSakeDetail()
})

// フレーバーチャートの値を安全に取得するヘルパー関数
const getFlavorValue = (key: string): number => {
  return (
    sake.value?.flavor_chart?.[key as keyof Required<NonNullable<SakeDetail['flavor_chart']>>] ?? 0
  )
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
          <button
            @click="toggleFavorite"
            class="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            :disabled="isUpdatingFavorite"
          >
            <Star
              class="w-6 h-6"
              :class="{
                'text-yellow-500 fill-yellow-500': isFavorite,
                'text-gray-600': !isFavorite,
              }"
            />
            <!-- ローディングインジケーター -->
            <div
              v-if="isUpdatingFavorite"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div
                class="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
              ></div>
            </div>
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

        <!-- フレーバーチャート -->
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
                    width: `${(Math.floor(getFlavorValue(flavor.key) * 500) / 100) * 20}%`,
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
