<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { ArrowLeft, Store, MapPin, AlertCircle, Plus, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import AppHeader from '@/components/AppHeader.vue'

interface Area {
  id: number
  name: string
}

interface Brewery {
  id: number
  name: string
  area_id: number
}

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// フォームデータ
const sakeName = ref('')
const selectedAreaId = ref<number | null>(null)
const selectedBrewery = ref<Brewery | null>(null)
const brewerySearchQuery = ref('')
const showNewBreweryForm = ref(false)
const newBreweryName = ref('')

// データリスト
const areas = ref<Area[]>([])
const breweries = ref<Brewery[]>([])

// エラー状態
const nameError = ref('')
const breweryError = ref('')
const areaError = ref('')
// スクロール位置の制御用
const listContainer = ref<HTMLElement | null>(null)

// 地域リストの取得
const fetchAreas = async () => {
  try {
    const { data, error } = await supabase
      .from('areas')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) throw error
    areas.value = data || []
  } catch (error) {
    console.error('Error fetching areas:', error)
    errorMessage.value = '地域リストの取得に失敗しました'
  }
}

// 酒造リストの取得
const fetchBreweries = async () => {
  try {
    const query = supabase
      .from('breweries')
      .select('id, name, area_id')
      .order('name', { ascending: true })

    if (selectedAreaId.value) {
      query.eq('area_id', selectedAreaId.value)
    }

    const { data, error } = await query
    if (error) throw error
    breweries.value = data || []
  } catch (error) {
    console.error('Error fetching breweries:', error)
    errorMessage.value = '酒造リストの取得に失敗しました'
  }
}

// 検索された酒造リスト
const filteredBreweries = computed(() => {
  if (!brewerySearchQuery.value) return breweries.value
  const query = brewerySearchQuery.value.toLowerCase()
  return breweries.value.filter((brewery) => brewery.name.toLowerCase().includes(query))
})

// 新しい酒造の追加
const addNewBrewery = async () => {
  if (!newBreweryName.value.trim() || !selectedAreaId.value) {
    errorMessage.value = '酒造名と地域を入力してください'
    return
  }

  try {
    isLoading.value = true
    const { data, error } = await supabase
      .from('breweries')
      .insert([
        {
          name: newBreweryName.value.trim(),
          area_id: selectedAreaId.value,
        },
      ])
      .select()
      .single()

    if (error) throw error

    if (data) {
      breweries.value.push(data)
      selectedBrewery.value = data
      showNewBreweryForm.value = false
      newBreweryName.value = ''
      successMessage.value = '新しい酒造を追加しました'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (error) {
    console.error('Error adding brewery:', error)
    errorMessage.value = '酒造の追加に失敗しました'
  } finally {
    isLoading.value = false
  }
}

// フォームのバリデーション
const validateForm = () => {
  let isValid = true
  nameError.value = ''
  breweryError.value = ''

  if (!sakeName.value.trim()) {
    nameError.value = '日本酒名を入力してください'
    isValid = false
  }

  if (!selectedBrewery.value) {
    breweryError.value = '酒造を選択してください'
    isValid = false
  }

  return isValid
}

// 日本酒の登録
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const { data, error } = await supabase
      .from('brands')
      .insert([
        {
          name: sakeName.value.trim(),
          brewery_id: selectedBrewery.value?.id,
        },
      ])
      .select()

    if (error) throw error

    successMessage.value = '日本酒を登録しました'
    setTimeout(() => {
      router.push('/sake')
    }, 3000)
  } catch (error) {
    console.error('Error adding sake:', error)
    errorMessage.value = '日本酒の登録に失敗しました'
  } finally {
    isLoading.value = false
  }
}

// 地域選択時の処理
watch(selectedAreaId, async () => {
  selectedBrewery.value = null
  brewerySearchQuery.value = ''
  if (selectedAreaId.value) {
    await fetchBreweries()
  }
})

const handleBack = () => {
  router.back()
}

// 初期データの取得
fetchAreas()
</script>

<template>
  <div class="mx-auto bg-gray-50 min-h-screen pb-8">
    <AppHeader />

    <!-- ヘッダー部分 -->
    <div class="flex items-center mb-4 px-4 space-x-4 sticky top-0 bg-gray-50 z-10 py-2">
      <button
        @click="handleBack"
        class="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 active:bg-gray-200"
      >
        <ArrowLeft class="w-6 h-6 text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-900">日本酒を追加</h1>
    </div>

    <!-- メインコンテンツ -->
    <div class="px-4">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 日本酒名入力 -->
          <div class="space-y-2">
            <label for="sakeName" class="block text-sm font-medium text-gray-700">
              日本酒名 *
            </label>
            <div class="relative">
              <input
                id="sakeName"
                v-model="sakeName"
                type="text"
                placeholder="日本酒名を入力"
                class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 transition-all duration-200"
                :class="{ 'border-red-300 ring-2 ring-red-200': nameError }"
              />
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <p v-if="nameError" class="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle class="w-4 h-4 mr-1 flex-shrink-0" />
                  {{ nameError }}
                </p>
              </transition>
            </div>
          </div>

          <!-- 地域選択 -->
          <div class="space-y-2">
            <label for="area" class="block text-sm font-medium text-gray-700"> 地域を選択 * </label>
            <select
              id="area"
              v-model="selectedAreaId"
              class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 transition-all duration-200 bg-white"
            >
              <option value="" disabled selected>地域を選択してください</option>
              <option v-for="area in areas" :key="area.id" :value="area.id">
                {{ area.name }}
              </option>
            </select>
          </div>

          <!-- 酒造検索 -->
          <div v-if="selectedAreaId" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700"> 酒造を検索 * </label>
              <div class="relative">
                <input
                  v-model="brewerySearchQuery"
                  type="text"
                  placeholder="酒造名で検索..."
                  class="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 transition-all duration-200"
                  :class="{ 'border-red-300 ring-2 ring-red-200': breweryError }"
                />
                <Search
                  class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                />
              </div>
            </div>

            <!-- スクロール可能な酒造リスト -->
            <div
              ref="listContainer"
              class="max-h-[40vh] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            >
              <div class="space-y-2 p-0.5">
                <div
                  v-for="brewery in filteredBreweries"
                  :key="brewery.id"
                  @click="selectedBrewery = brewery"
                  class="group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md"
                  :class="[
                    selectedBrewery?.id === brewery.id
                      ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-white ring-1 ring-indigo-500'
                      : 'border-gray-100 hover:border-gray-200 bg-white',
                  ]"
                >
                  <div class="flex items-start space-x-3">
                    <div class="flex-grow">
                      <h3
                        class="text-base font-medium transition-colors"
                        :class="
                          selectedBrewery?.id === brewery.id ? 'text-indigo-900' : 'text-gray-900'
                        "
                      >
                        {{ brewery.name.length ? brewery.name : '酒造なし' }}
                      </h3>
                      <div class="flex items-center space-x-2 mt-1">
                        <MapPin class="w-4 h-4 text-gray-400" />
                        <p class="text-sm text-gray-500">
                          {{ areas.find((area) => area.id === brewery.area_id)?.name }}
                        </p>
                      </div>
                    </div>
                    <div
                      class="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200"
                      :class="
                        selectedBrewery?.id === brewery.id
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300 group-hover:border-gray-400'
                      "
                    >
                      <svg
                        v-if="selectedBrewery?.id === brewery.id"
                        class="w-4 h-4 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <!-- 検索結果なしの表示 -->
                <div
                  v-if="filteredBreweries.length === 0"
                  class="text-center py-8 px-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div
                    class="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4"
                  >
                    <Search class="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">酒造が見つかりません</h3>
                  <p class="text-sm text-gray-500">
                    新しい酒造を追加するか、検索条件を変更してください
                  </p>
                </div>
              </div>
            </div>

            <!-- 新しい酒造の追加 -->
            <div class="pt-2">
              <button
                type="button"
                @click="showNewBreweryForm = !showNewBreweryForm"
                class="text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 transition-colors duration-200"
              >
                <Plus class="w-4 h-4" />
                <span>新しい酒造を追加</span>
              </button>

              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 transform -translate-y-4"
                enter-to-class="opacity-100 transform translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 transform translate-y-0"
                leave-to-class="opacity-0 transform -translate-y-4"
              >
                <div
                  v-if="showNewBreweryForm"
                  class="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <input
                    v-model="newBreweryName"
                    type="text"
                    placeholder="新しい酒造名を入力"
                    class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 mb-4 transition-all duration-200"
                  />
                  <button
                    type="button"
                    @click="addNewBrewery"
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center space-x-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="isLoading"
                  >
                    <LoadingSpinner v-if="isLoading" class="w-5 h-5" />
                    <span>{{ isLoading ? '追加中...' : '酒造を追加' }}</span>
                  </button>
                </div>
              </transition>
            </div>
          </div>

          <!-- エラー・成功メッセージ -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 transform -translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform -translate-y-4"
          >
            <div
              v-if="errorMessage"
              class="bg-red-50 text-red-600 p-4 rounded-lg flex items-center"
            >
              <AlertCircle class="w-5 h-5 mr-2 flex-shrink-0" />
              {{ errorMessage }}
            </div>
          </transition>

          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 transform -translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform -translate-y-4"
          >
            <div
              v-if="successMessage"
              class="bg-green-50 text-green-600 p-4 rounded-lg flex items-center"
            >
              <Store class="w-5 h-5 mr-2 flex-shrink-0" />
              {{ successMessage }}
            </div>
          </transition>

          <!-- 送信ボタン -->
          <div class="pt-4">
            <button
              type="submit"
              class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:bg-indigo-800"
              :disabled="isLoading"
            >
              <LoadingSpinner v-if="isLoading" class="w-5 h-5" />
              <span>{{ isLoading ? '登録中...' : '登録する' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* スクロールバーのスタイル */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* セレクトボックスのカスタマイズ */
select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* モバイル用フォントサイズ調整 */
input,
select {
  font-size: 16px !important;
  -webkit-text-size-adjust: 100%;
}

/* アニメーション関連のスタイル */
@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* タッチデバイス用のアクティブ状態の調整 */
@media (hover: none) {
  .hover\:bg-gray-100:active {
    background-color: #f3f4f6;
  }

  .hover\:bg-indigo-700:active {
    background-color: #4338ca;
  }
}

/* iOS用の入力欄スタイル調整 */
input[type='text'],
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* フォーカス時のアウトラインの調整 */
:focus {
  outline: none;
}

/* スクロールの滑らかさの設定 */
.smooth-scroll {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
</style>
