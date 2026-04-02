<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 items-end pointer-events-none">
    <TransitionGroup name="toast-list">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/20 w-fit min-w-[200px]"
      >
        <span class="text-lg">📋</span>
        <div>
          <p class="font-bold text-sm">{{ toast.message }}</p>
          <p class="text-[10px] opacity-90">{{ toast.subtext }}</p>
        </div>
        <button @click="removeToast(toast.id)" class="ml-2 opacity-50 hover:opacity-100 text-xs">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast'
const { toasts, removeToast } = useToast()
</script>

<style scoped>
/* The Stack Animation */
.toast-list-enter-active,
.toast-list-leave-active,
.toast-list-move {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.8);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* Ensure smooth sliding when an item in the middle is removed */
.toast-list-leave-active {
  position: absolute;
}
</style>