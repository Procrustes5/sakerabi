<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { X, Search } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

interface SearchResult {
  id: number
  name: string
  brewery: {
    id: number
    name: string
    area: {
      id: number
      name: string
    }
  }
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

const props = defineProps<Props>()
const router = useRouter()

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)
const errorMessage = ref('')

// 検索処理
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  try {
    isSearching.value = true
    errorMessage.value = ''

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
        )
      `,
      )
      .ilike('name', `%${searchQuery.value}%`)
      .limit(10)

    if (error) throw error

    searchResults.value = data || []
  } catch (error) {
    console.error('Search error:', error)
    errorMessage.value = '検索中にエラーが発生しました'
  } finally {
    isSearching.value = false
  }
}

// 詳細ページへの遷移
const navigateToDetail = (sake: SearchResult) => {
  router.push(`/sake/${sake.id}`)
  props.onClose()
}
</script>

<template>
  <div
    v-if="props.isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="props.onClose"
  >
    <div class="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
      <!-- 検索ヘッダー -->
      <div class="p-4 border-b">
        <div class="flex items-center space-x-2">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="日本酒を検索..."
              class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500 text-base" <!-- text-baseを追加 -->
            @keyup.enter="handleSearch"
            />
            <Search
              class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
          <button @click="props.onClose" class="p-2 hover:bg-gray-100 rounded-full">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      <!-- 残りの部分は変更なし -->
    </div>
  </div>
</template>

<style scoped>
/* フォントサイズを明示的に設定 */
input {
  font-size: 16px !important; /* モバイルでの自動ズームを防ぐ */
  -webkit-text-size-adjust: 100%; /* iOSでのテキストサイズ自動調整を無効化 */
}
</style>
