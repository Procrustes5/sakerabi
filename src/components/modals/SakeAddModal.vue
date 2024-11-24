<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { X } from 'lucide-vue-next'
import SakeSearch, { type SearchResult } from '../SakeSearch.vue'

interface Props {
  isOpen: boolean
  eventId: number
  onClose: () => void
  onAdd: () => void
}

const props = defineProps<Props>()

const errorMessage = ref('')
const isAdding = ref(false)

// イベントに日本酒を追加
const addSakeToEvent = async (brand: SearchResult) => {
  try {
    isAdding.value = true
    errorMessage.value = ''

    // 既に追加済みかチェック
    const { data: existing, error: checkError } = await supabase
      .from('event_brands')
      .select('id')
      .eq('event_id', props.eventId)
      .eq('brand_id', brand.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') throw checkError

    if (existing) {
      errorMessage.value = 'この日本酒は既に追加されています'
      return
    }

    const { error } = await supabase.from('event_brands').insert({
      event_id: props.eventId,
      brand_id: brand.id,
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    props.onAdd()
    props.onClose()
  } catch (error) {
    console.error('Error adding sake to event:', error)
    errorMessage.value = '日本酒の追加に失敗しました'
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <div
    v-if="props.isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="props.onClose"
  >
    <div class="bg-white rounded-xl p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-900">日本酒を追加</h3>
        <button @click="props.onClose" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <SakeSearch @select="addSakeToEvent" />

      <p v-if="errorMessage" class="mt-4 text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <div v-if="isAdding" class="mt-4 text-center text-gray-600">追加中...</div>
    </div>
  </div>
</template>
