import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  icon?: string
}

const toasts = ref<Toast[]>([])
let nextId = 0

export const useToast = () => {
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = nextId++
    toasts.value.push({ ...toast, id })

    // 3秒後に自動的に消える
    setTimeout(() => {
      removeToast(id)
    }, 3000)

    return id
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string) => {
    return addToast({
      message,
      type: 'success',
      icon: '✓',
    })
  }

  const error = (message: string) => {
    return addToast({
      message,
      type: 'error',
      icon: '✕',
    })
  }

  const info = (message: string) => {
    return addToast({
      message,
      type: 'info',
      icon: 'i',
    })
  }

  return {
    toasts,
    success,
    error,
    info,
    remove: removeToast,
  }
}
