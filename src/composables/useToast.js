import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  const showToast = (title, subtext = 'Action successful', type = 'success') => {
    const id = Date.now() + Math.random() // Unique ID
    
    // Add to the stack
    toasts.value.push({ id, title, subtext, type })

    const readingTime = subtext.length * 60 // ms
    const minTime = 2000
    const maxTime = 6000

    const duration = Math.min(Math.max(readingTime, minTime), maxTime)

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    removeToast
  }
}