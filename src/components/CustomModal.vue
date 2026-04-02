<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div @click="$emit('cancel')" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

      <div class="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 transform transition-all">
        
        <div class="text-center">
          <div class="mb-4 flex justify-center">
            <slot name="icon">
              <div class="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-500 rounded-full flex items-center justify-center text-2xl">
                ❓
              </div>
            </slot>
          </div>

          <h3 class="text-xl font-bold mb-2">{{ title }}</h3>
          <p class="text-sm opacity-60 mb-8 leading-relaxed">
            <slot name="message">{{ message }}</slot>
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">

          <button 
            v-if="showNo" 
            @click="$emit('no')" 
            class="flex-1 px-6 py-3 rounded-2xl font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
          >
            No
          </button>

          <button 
            @click="$emit('confirm')" 
            class="flex-1 px-6 py-3 rounded-2xl font-bold bg-teal-500 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-95"
          >
            {{ confirmText }}
          </button>
          <button 
            v-if="showCancel" 
            @click="$emit('cancel')" 
            class="flex-1 px-6 py-3 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Are you sure?' },
  message: String,
  confirmText: { type: String, default: 'Yes' },
  showCancel: { type: Boolean, default: true },
  showNo: { type: Boolean, default: false }
})

defineEmits(['confirm', 'cancel', 'no'])
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: scale(0.95); }
</style>