<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { Search } from 'lucide-vue-next'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

export interface SearchResult {
  id: number
  name: string
  brewery: {
    name: string
  }
}

interface Props {
  onSelect: (brand: SearchResult) => void
}

const props = defineProps<Props>()

const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const isSearching = ref(false)

const searchSake = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(
        `
        id,
        name,
        brewery:breweries (
          name
        )
      `,
      )
      .ilike('name', `%${searchQuery.value}%`)
      .limit(10)

    if (error) throw error
    searchResults.value = data
  } catch (error) {
    console.error('Error searching sake:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 検索クエリが変更されたら検索を実行
watch(
  () => searchQuery.value,
  () => {
    searchSake()
  },
)
</script>

<template>
  <div>
    <div class="relative mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="日本酒を検索..."
        class="w-full p-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <Search class="w-5 h-5 text-gray-400 absolute right-3 top-2.5" />
    </div>

    <div v-if="isSearching" class="text-center py-4">
      <LoadingSpinner />
    </div>

    <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
      <button
        v-for="brand in searchResults"
        :key="brand.id"
        @click="props.onSelect(brand)"
        class="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div class="font-medium text-gray-900">{{ brand.name }}</div>
        <div class="text-sm text-gray-600">{{ brand.brewery.name }}</div>
      </button>
    </div>

    <div v-else-if="searchQuery" class="text-center py-4">
      <p class="text-gray-500">検索結果がありません</p>
    </div>
  </div>
</template>
