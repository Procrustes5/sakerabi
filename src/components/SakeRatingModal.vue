<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { Camera, X } from 'lucide-vue-next'
import FlavorRating from './FlavorRating.vue'

interface Props {
  isOpen: boolean
  eventBrandId: number
  brandName: string
  breweryName: string
  onClose: () => void
  onSubmit: () => void
}

const props = defineProps<Props>()

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

// Fetch existing rating with improved error handling
const fetchExistingRating = async () => {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('認証エラー: ' + authError.message)
    if (!userData.user) return

    const { data, error } = await supabase
      .from('sake_flavor_ratings')
      .select('*')
      .eq('event_brand_id', props.eventBrandId)
      .eq('profile_id', userData.user.id)
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

// Improved rating submission with better error handling
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

    const ratingData = {
      profile_id: userData.user.id,
      event_brand_id: props.eventBrandId,
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

    if (error) {
      throw new Error(`データベースエラー: ${error.message}`)
    }

    props.onSubmit()
    props.onClose()
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
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      fetchExistingRating()
    } else {
      resetForm()
    }
  },
)
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="onClose"
  >
    <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="mb-6">
        <h3 class="text-2xl font-bold text-gray-900">{{ brandName }}</h3>
        <p class="text-gray-600">{{ breweryName }}</p>
      </div>

      <div class="flex justify-center mb-6">
        <FlavorRating v-model:values="flavorValues" :editable="true" :size="300" />
      </div>

      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <h4 class="text-sm font-medium text-gray-700">画像</h4>
          <span class="text-xs text-gray-500">(オプション・最大5MB・JPEG/PNG/GIF)</span>
        </div>

        <div v-if="!imagePreview" class="flex justify-center">
          <label class="w-full cursor-pointer group">
            <div
              class="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center group-hover:border-indigo-500 transition-colors"
            >
              <div class="text-center">
                <Camera
                  class="mx-auto w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition-colors"
                />
                <span class="mt-2 block text-sm text-gray-500"> クリックして画像を選択 </span>
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
          <img :src="imagePreview" class="w-full h-40 object-cover rounded-lg" alt="Preview" />
          <button
            @click="removeImage"
            class="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            type="button"
          >
            <X class="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div
          v-if="uploadProgress > 0 && uploadProgress < 100"
          class="mt-2 w-full bg-gray-200 rounded-full h-2.5"
        >
          <div
            class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
      </div>

      <div class="mb-6">
        <label for="comment" class="block text-sm font-medium text-gray-700 mb-2"> コメント </label>
        <textarea
          id="comment"
          v-model="comment"
          rows="4"
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500"
          placeholder="この日本酒の感想を書いてください..."
        ></textarea>
      </div>

      <p v-if="errorMessage" class="text-red-600 text-sm mb-4">
        {{ errorMessage }}
      </p>

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
          class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isSubmitting">
            {{ uploadProgress > 0 ? `アップロード中... ${uploadProgress}%` : '送信中...' }}
          </span>
          <span v-else>{{ existingRating ? '更新' : '評価を送信' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
