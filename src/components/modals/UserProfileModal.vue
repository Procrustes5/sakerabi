<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { X, Clock, MapPin, ChevronRight } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'
import { supabase } from '@/utils/supabase'

interface UserRating {
  id: string
  sakeName: string
  sakeId: string
  rating: number
  content: string
  created_at: string
  event: {
    name: string
    location: string
    date: string
  }
  image_url?: string
}

interface Props {
  modelValue: boolean
  profileId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const profile = ref<any>(null)
const userRatings = ref<UserRating[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const router = useRouter()

// プロフィール情報の取得
const fetchUserProfile = async () => {
  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', props.profileId)
      .single()

    if (profileError) throw profileError
    profile.value = data
  } catch (e) {
    console.error('Error fetching profile:', e)
    error.value = 'プロフィールの取得に失敗しました'
  }
}

// ユーザーの評価履歴の取得
const fetchUserRatings = async () => {
  try {
    const { data, error: ratingsError } = await supabase
      .from('sake_flavor_ratings')
      .select(`
        id,
        comment,
        created_at,
        image_url,
        event_brand:event_brands(
          event:events(
            name,
            location,
            date
          ),
          brand:brands(
            id,
            name
          )
        )
      `)
      .eq('profile_id', props.profileId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ratingsError) throw ratingsError

    // データの整形を修正
    userRatings.value = data?.map(rating => ({
      id: rating.id,
      sakeName: rating.event_brand?.brand?.name || '不明',
      sakeId: rating.event_brand?.brand?.id,
      content: rating.comment || '',
      created_at: rating.created_at,
      image_url: rating.image_url,
      event: {
        name: rating.event_brand?.event?.name || '不明',
        location: rating.event_brand?.event?.location || '不明',
        date: rating.event_brand?.event?.date || ''
      }
    })) || []
  } catch (e) {
    console.error('Error fetching ratings:', e)
    error.value = '評価履歴の取得に失敗しました'
  }
}

const loadData = async () => {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      fetchUserProfile(),
      fetchUserRatings()
    ])
  } catch (e) {
    console.error('Error loading data:', e)
    error.value = 'データの読み込みに失敗しました'
  } finally {
    isLoading.value = false
  }
}

// モーダルの表示状態が変更されたときにデータを再取得
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadData()
  }
})

// 評価件数
const ratingCount = computed(() => userRatings.value.length)

// 日付のフォーマット
const formatDate = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja })
}

// モーダルを閉じる
const closeModal = () => {
  emit('update:modelValue', false)
}

onMounted(() => {
  if (props.modelValue) {
    loadData()
  }
})
</script>

<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="closeModal"
  >
    <!-- オーバーレイ -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

    <!-- モーダルコンテンツ -->
    <div
      class="relative min-h-screen flex items-center justify-center p-4"
      @click.stop
    >
      <div
        class="relative bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden"
      >
        <!-- ヘッダー -->
        <div class="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
          <button
            @click="closeModal"
            class="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition-colors"
          >
            <X class="w-5 h-5 text-white" />
          </button>
        </div>

        <!-- プロフィール情報 -->
        <div class="relative px-6 pb-6">
          <div class="absolute -top-16 left-6">
            <div v-if="isLoading" class="w-32 h-32 rounded-full bg-gray-200 animate-pulse" />
            <img
              v-else
              :src="profile?.avatar_url || '/images/default-avatar.png'"
              :alt="profile?.display_name"
              class="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
          </div>

          <div class="pt-20">
            <div v-if="isLoading">
              <div class="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div class="mt-2 h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <template v-else>
              <h2 class="text-2xl font-bold text-gray-900">
                {{ profile?.display_name || '読み込み中...' }}
              </h2>
              <p v-if="profile?.bio" class="mt-2 text-gray-600">
                {{ profile.bio }}
              </p>
            </template>

            <!-- 統計情報 -->
            <div class="mt-6 flex space-x-4">
              <div class="text-center">
                <div class="text-xl font-bold text-gray-900">{{ ratingCount }}</div>
                <div class="text-sm text-gray-500">レビュー</div>
              </div>
            </div>
          </div>

          <!-- 評価履歴 -->
          <div class="mt-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              最近の評価
            </h3>

            <div v-if="isLoading" class="space-y-4">
              <div v-for="n in 3" :key="n" class="bg-gray-50 rounded-lg p-4">
                <div class="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div class="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            <div v-else-if="error" class="py-8 text-center text-red-500">
              {{ error }}
            </div>

            <div v-else-if="userRatings.length === 0" class="py-8 text-center text-gray-500">
              まだ評価がありません
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="rating in userRatings"
                :key="rating.id"
                class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                @click="router.push(`/sake/${rating.sakeId}`)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-gray-900">{{ rating.sakeName }}</h4>
                    <div class="mt-1 text-sm text-gray-500">
                      <div class="flex items-center">
                        <Clock class="w-4 h-4 mr-1" />
                        {{ formatDate(rating.created_at) }}
                      </div>
                      <div class="flex items-center mt-1">
                        <MapPin class="w-4 h-4 mr-1" />
                        {{ rating.event.location }}
                      </div>
                    </div>
                  </div>
                  <ChevronRight class="w-5 h-5 text-gray-400" />
                </div>

                <p v-if="rating.content" class="mt-2 text-gray-600">
                  {{ rating.content }}
                </p>

                <img
                  v-if="rating.image_url"
                  :src="rating.image_url"
                  :alt="rating.sakeName"
                  class="mt-2 rounded-lg w-full h-32 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
