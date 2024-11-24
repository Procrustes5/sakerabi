<script setup lang="ts">
import { ref } from 'vue'
import { Mail, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-vue-next'
import AppHeader from '@/components/AppHeader.vue'

interface FAQ {
  question: string
  answer: string
}

const openItem = ref<number | null>(null)

const faqs: FAQ[] = [
  {
    question: 'ログインについて',
    answer:
      '現在、本アプリではGoogleアカウントを使用したログインのみに対応しています。管理者がシステムにメールアドレスを登録する必要があるため、当システムを利用する方は管理者にご連絡ください。',
  },
  {
    question: 'イベントの作成について',
    answer:
      'どなたでも自由にイベントを作成することができます。イベントページから「新規イベント作成」ボタンを押して、必要事項を入力するだけです。',
  },
  {
    question: '日本酒の追加について',
    answer:
      'すべてのユーザーが新しい日本酒を追加することができます。なお、デフォルトで登録されている日本酒の情報は「さけのわデータ」をソースとして使用しています。',
  },
  {
    question: 'お問い合わせ方法',
    answer: 'ご不明点やご質問がございましたら、管理者までご連絡ください。',
  },
]

const handleItemClick = (index: number) => {
  openItem.value = openItem.value === index ? null : index
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />

    <main class="container mx-auto px-4 py-6 max-w-lg">
      <!-- ヘッダーセクション -->
      <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <HelpCircle class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">ヘルプとサポート</h1>
            <p class="text-sm text-gray-500">よくある質問と回答</p>
          </div>
        </div>
      </div>

      <!-- FAQセクション -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="border-b border-gray-100 last:border-0"
        >
          <button
            @click="handleItemClick(index)"
            class="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
          >
            <span class="text-sm font-medium text-gray-900">{{ faq.question }}</span>
            <ChevronUp v-if="openItem === index" class="w-5 h-5 text-gray-400" />
            <ChevronDown v-else class="w-5 h-5 text-gray-400" />
          </button>
          <div v-if="openItem === index" class="px-4 pb-4 text-sm text-gray-600">
            {{ faq.answer }}
          </div>
        </div>
      </div>

      <!-- お問い合わせセクション -->
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Mail class="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">お問い合わせ</h2>
            <p class="text-sm text-gray-500">ご不明点があればお気軽にご連絡ください</p>
          </div>
        </div>
        <div class="mt-4 p-4 bg-gray-50 rounded-xl">
          <div class="flex items-start space-x-3">
            <AlertCircle class="w-5 h-5 text-gray-400 mt-0.5" />
            <p class="text-sm text-gray-600">
              その他のご質問やご要望については、管理者までご連絡ください。できる限り迅速に対応させていただきます。
            </p>
          </div>
        </div>
      </div>

      <!-- アプリバージョン -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-400">アプリバージョン 1.0.0</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  max-width: 640px;
}
</style>
