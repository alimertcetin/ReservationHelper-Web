import { ref } from 'vue'

const toasts = ref([])

export function useToast() {
  const showToast = (message, subtext = 'Action successful', type = 'success') => {
    const id = Date.now() + Math.random() // Unique ID
    
    // Add to the stack
    toasts.value.push({ id, message, subtext, type })

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id)
    }, 3000)
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