<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { Camera, X, Calendar, ChevronDown } from 'lucide-vue-next'
import FlavorRating from '../FlavorRating.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
}>()

const props = defineProps<{
  isOpen: boolean
  brandId: number
  brandName: string
  breweryName: string
}>()

interface Event {
  id: number
  name: string
  date: string
  location: string
}

interface FlavorRating {
  id: number
  f1_hanayaka: number
  f2_houjun: number
  f3_juukou: number
  f4_odayaka: number
  f5_dry: number
  f6_keiikai: number
  comment: string
  image_url: string | null
  created_at: string
  event_brand_id: number
}

const flavorValues = ref({
  f1_hanayaka: 0,
  f2_houjun: 0,
  f3_juukou: 0,
  f4_odayaka: 0,
  f5_dry: 0,
  f6_keiikai: 0,
})

const comment = ref('')
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const isSubmitting = ref(false)
const existingRating = ref<FlavorRating | null>(null)
const errorMessage = ref('')
const uploadProgress = ref(0)

// イベント関連の状態
const events = ref<Event[]>([])
const selectedEvent = ref<Event | null>(null)
const showEventSelector = ref(false)
const isLoadingEvents = ref(false)

// イベント一覧の取得
const fetchEvents = async () => {
  try {
    isLoadingEvents.value = true
    const { data, error } = await supabase
      .from('events')
      .select('id, name, date, location')
      .order('date', { ascending: false })
      .limit(50)

    if (error) throw error
    events.value = data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    errorMessage.value = 'イベントの取得に失敗しました'
  } finally {
    isLoadingEvents.value = false
  }
}

// 既存の評価を取得する際にイベント情報も取得
const fetchExistingRating = async () => {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('認証エラー: ' + authError.message)
    if (!userData.user) return

    // まず event_brands から該当するレコードを検索
    const { data: eventBrands, error: eventBrandsError } = await supabase
      .from('event_brands')
      .select('id, event:events(*)')
      .eq('brand_id', props.brandId)

    if (eventBrandsError) throw eventBrandsError

    const eventBrandIds = eventBrands?.map(eb => eb.id) || []

    if (eventBrandIds.length > 0) {
      const { data, error } = await supabase
        .from('sake_flavor_ratings')
        .select(`
          *,
          event_brand:event_brands(
            id,
            event:events(
              id,
              name,
              date,
              location
            )
          )
        `)
        .eq('profile_id', userData.user.id)
        .in('event_brand_id', eventBrandIds)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        existingRating.value = data
        flavorValues.value = {
          f1_hanayaka: data.f1_hanayaka,
          f2_houjun: data.f2_houjun,
          f3_juukou: data.f3_juukou,
          f4_odayaka: data.f4_odayaka,
          f5_dry: data.f5_dry,
          f6_keiikai: data.f6_keiikai,
        }
        comment.value = data.comment || ''
        if (data.image_url) {
          imagePreview.value = data.image_url
        }
        // イベント情報の設定
        if (data.event_brand?.event) {
          selectedEvent.value = data.event_brand.event
        }
      }
    }
  } catch (error) {
    console.error('Error fetching existing rating:', error)
    errorMessage.value = '評価の取得に失敗しました'
  }
}

// Improved image upload with better error handling and validation
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      throw new Error('対応していない画像形式です (JPEG, PNG, GIF のみ対応)')
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt) throw new Error('ファイル拡張子が無効です')

    // Generate a unique filename using timestamp and random string
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomString}.${fileExt}`
    const filePath = `sake-ratings/${fileName}`

    // Upload with progress tracking
    const { error: uploadError, data } = await supabase.storage
      .from('sake-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      if (uploadError.message.includes('storage quota')) {
        throw new Error('ストレージの容量制限に達しました')
      }
      throw new Error(`アップロードエラー: ${uploadError.message}`)
    }

    if (!data) throw new Error('アップロードデータが見つかりません')

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('sake-images').getPublicUrl(filePath)

    if (!publicUrlData.publicUrl) {
      throw new Error('画像URLの取得に失敗しました')
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error // Re-throw to handle in submitRating
  }
}

// Image selection with improved validation
const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return

  const file = input.files[0]

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = '画像サイズは5MB以下にしてください'
    input.value = ''
    return
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = '対応していない画像形式です (JPEG, PNG, GIF のみ対応)'
    input.value = ''
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  errorMessage.value = '' // Clear any previous errors
}

const removeImage = () => {
  imageFile.value = null
  imagePreview.value = null
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  if (input) input.value = ''
  errorMessage.value = '' // Clear any previous errors
}

// 評価の送信処理を修正
const submitRating = async () => {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('認証エラー: ' + authError.message)
    if (!userData.user) {
      throw new Error('ログインが必要です')
    }

    isSubmitting.value = true
    errorMessage.value = ''
    uploadProgress.value = 0

    let imageUrl = existingRating.value?.image_url || null
    if (imageFile.value) {
      try {
        imageUrl = await uploadImage(imageFile.value)
      } catch (uploadError) {
        throw new Error(
          `画像のアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : '不明なエラー'}`,
        )
      }
    }

    // イベントが選択されている場合は event_brands テーブルにレコードを作成または取得
    let eventBrandId = existingRating.value?.event_brand_id
    if (selectedEvent.value) {
      const { data: eventBrand, error: eventBrandError } = await supabase
        .from('event_brands')
        .select('id')
        .eq('event_id', selectedEvent.value.id)
        .eq('brand_id', props.brandId)
        .single()

      if (eventBrandError && eventBrandError.code === 'PGRST116') {
        // レコードが存在しない場合は新規作成
        const { data: newEventBrand, error: createError } = await supabase
          .from('event_brands')
          .insert({
            event_id: selectedEvent.value.id,
            brand_id: props.brandId,
          })
          .select('id')
          .single()

        if (createError) throw createError
        eventBrandId = newEventBrand?.id
      } else if (eventBrandError) {
        throw eventBrandError
      } else {
        eventBrandId = eventBrand.id
      }
    }

    // イベントが選択されていない場合は null
    const ratingData = {
      profile_id: userData.user.id,
      event_brand_id: eventBrandId,
      ...flavorValues.value,
      comment: comment.value,
      image_url: imageUrl,
    }

    let error
    if (existingRating.value) {
      const { error: updateError } = await supabase
        .from('sake_flavor_ratings')
        .update(ratingData)
        .eq('id', existingRating.value.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('sake_flavor_ratings').insert(ratingData)
      error = insertError
    }

    if (error) throw error

    emit('submit')
    emit('close')
  } catch (error) {
    console.error('Error submitting rating:', error)
    errorMessage.value = error instanceof Error ? error.message : '評価の送信に失敗しました'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  flavorValues.value = {
    f1_hanayaka: 0,
    f2_houjun: 0,
    f3_juukou: 0,
    f4_odayaka: 0,
    f5_dry: 0,
    f6_keiikai: 0,
  }
  comment.value = ''
  imageFile.value = null
  imagePreview.value = null
  errorMessage.value = ''
  existingRating.value = null
  uploadProgress.value = 0
  selectedEvent.value = null
  showEventSelector.value = false
}

// イベントの外側をクリックした時にセレクターを閉じる
const closeEventSelector = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.event-selector')) {
    showEventSelector.value = false
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchEvents()
      fetchExistingRating()
      // イベントリスナーを追加
      document.addEventListener('click', closeEventSelector)
    } else {
      resetForm()
      // イベントリスナーを削除
      document.removeEventListener('click', closeEventSelector)
    }
  }
)

// コンポーネントのアンマウント時にイベントリスナーを削除
onUnmounted(() => {
  document.removeEventListener('click', closeEventSelector)
})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
      <!-- ヘッダー -->
      <div class="sticky top-0 bg-white px-6 py-4 border-b">
        <h3 class="text-xl font-bold text-gray-900">{{ brandName }}</h3>
        <p class="text-sm text-gray-600">{{ breweryName }}</p>
      </div>

      <div class="p-6">
        <!-- イベント選択 -->
        <div class="mb-6 event-selector">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            イベント
            <span class="text-xs text-gray-500 font-normal">(オプション)</span>
          </label>
          <div class="relative">
            <button
              type="button"
              class="w-full px-4 py-2.5 bg-white border rounded-lg text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              @click="showEventSelector = !showEventSelector"
            >
              <span class="flex items-center gap-2 text-gray-700">
                <Calendar class="w-5 h-5" />
                <span v-if="selectedEvent">
                  {{ selectedEvent.name }} -
                  {{ new Date(selectedEvent.date).toLocaleDateString('ja-JP') }}
                </span>
                <span v-else class="text-gray-400">イベントを選択...</span>
              </span>
              <ChevronDown
                class="w-5 h-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': showEventSelector }"
              />
            </button>

            <!-- イベント選択メニュー -->
            <div
              v-if="showEventSelector"
              class="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto"
            >
              <div class="p-1">
                <div v-if="isLoadingEvents" class="p-3 text-center text-gray-500">
                  <span class="inline-block animate-spin mr-2">⏳</span>
                  読み込み中...
                </div>

                <template v-else>
                  <button
                    v-for="event in events"
                    :key="event.id"
                    type="button"
                    class="w-full px-3 py-2 text-left rounded-md hover:bg-gray-100 transition-colors"
                    @click="() => { selectedEvent = event; showEventSelector = false }"
                  >
                    <div class="text-gray-900">{{ event.name }}</div>
                    <div class="text-sm text-gray-500 flex items-center gap-2">
                      <span>{{ new Date(event.date).toLocaleDateString('ja-JP') }}</span>
                      <span class="text-gray-300">|</span>
                      <span>{{ event.location }}</span>
                    </div>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- フレーバーチャート -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-4">
            味わい
            <span class="text-red-500">*</span>
          </label>
          <div class="flex justify-center">
            <FlavorRating v-model:values="flavorValues" :editable="true" :size="280" />
          </div>
        </div>

        <!-- 画像アップロード -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-2">
            <h4 class="text-sm font-medium text-gray-700">画像</h4>
            <span class="text-xs text-gray-500">(オプション・最大5MB・JPEG/PNG/GIF)</span>
          </div>

          <div v-if="!imagePreview" class="flex justify-center">
            <label class="w-full cursor-pointer group">
              <div
                class="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center group-hover:border-indigo-500 transition-colors"
              >
                <div class="text-center">
                  <Camera
                    class="mx-auto w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors"
                  />
                  <span class="mt-2 block text-sm text-gray-500">タップして画像を選択</span>
                </div>
              </div>
              <input
                type="file"
                class="hidden"
                accept="image/jpeg,image/png,image/gif"
                @change="handleImageSelect"
              />
            </label>
          </div>

          <div v-else class="relative">
            <img
              :src="imagePreview"
              class="w-full aspect-video object-cover rounded-lg"
              alt="Preview"
            />
            <button
              @click="removeImage"
              class="absolute top-2 right-2 p-1 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
              type="button"
            >
              <X class="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <!-- アップロードプログレス -->
          <div
            v-if="uploadProgress > 0 && uploadProgress < 100"
            class="mt-2 w-full bg-gray-200 rounded-full h-2"
          >
            <div
              class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>

        <!-- コメント -->
        <div class="mb-6">
          <label for="comment" class="block text-sm font-medium text-gray-700 mb-2">
            コメント
          </label>
          <textarea
            id="comment"
            v-model="comment"
            rows="4"
            class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 resize-none"
            placeholder="この日本酒の感想を書いてください..."
          ></textarea>
        </div>

        <!-- エラーメッセージ -->
        <div
          v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {{ errorMessage }}
        </div>

        <!-- アクションボタン -->
        <div class="flex justify-end gap-3">
          <button
            @click="onClose"
            type="button"
            class="px-4 py-2 text-gray-600 hover:text-gray-700"
            :disabled="isSubmitting"
          >
            キャンセル
          </button>
          <button
            @click="submitRating"
            type="button"
            :disabled="isSubmitting || Object.values(flavorValues).every((v) => v === 0)"
            class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <span v-if="isSubmitting" class="flex items-center gap-2">
              <svg
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ uploadProgress > 0 ? `${uploadProgress}%` : '送信中...' }}
            </span>
            <span v-else>{{ existingRating ? '更新する' : '評価を投稿' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
