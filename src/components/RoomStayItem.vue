<template>
  <div class="p-5 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] bg-white dark:bg-slate-900 shadow-sm relative group mb-4 transition-all hover:border-slate-200 dark:hover:border-slate-700">
    <button v-if="canRemove" @click="$emit('remove')" 
            class="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full text-xs shadow-lg z-10 hover:scale-110 transition-transform">✕</button>
    
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-4 space-y-2">
        <label class="text-[10px] font-bold uppercase opacity-50">Room Type</label>
        <select v-model="room.type" class="modern-input" @change="fetchSuggestedPrice">
          <option v-for="type in roomTypes" :key="type">{{ type }}</option>
        </select>
      </div>

      <div class="md:col-span-5 space-y-2">
        <label class="text-[10px] font-bold uppercase opacity-50">Stay Dates</label>
        <input ref="dateInput" :value="room.dates" class="modern-input cursor-pointer" placeholder="Select Dates" readonly>
      </div>

      <div class="md:col-span-3 flex items-end gap-2">
        <div class="flex-1 text-center bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
          <p class="text-[9px] uppercase font-bold opacity-40">Adult</p>
          <div class="flex items-center justify-between mt-1">
            <button @click="room.adults = Math.max(1, room.adults - 1)" class="text-teal-500 px-1 hover:bg-teal-500/10 rounded">-</button>
            <span class="font-mono font-bold text-sm">{{ room.adults }}</span>
            <button @click="room.adults++" class="text-teal-500 px-1 hover:bg-teal-500/10 rounded">+</button>
          </div>
        </div>
        <div class="flex-1 text-center bg-slate-50 dark:bg-slate-800 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
          <p class="text-[9px] uppercase font-bold opacity-40">Child</p>
          <div class="flex items-center justify-between mt-1">
            <button @click="room.children = Math.max(0, room.children - 1)" class="text-teal-500 px-1 hover:bg-teal-500/10 rounded">-</button>
            <span class="font-mono font-bold text-sm">{{ room.children }}</span>
            <button @click="room.children++" class="text-teal-500 px-1 hover:bg-teal-500/10 rounded">+</button>
          </div>
        </div>
      </div>

      <div class="md:col-span-6 lg:col-span-4 space-y-2">
        <label class="text-[10px] font-bold uppercase opacity-50 text-blue-600">Suggested Price</label>
        <div class="modern-input bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 flex items-center justify-between">
          <span class="font-mono font-bold text-blue-600">{{ suggestedPrice }}₺</span>
          <button @click="applySuggested" class="text-[9px] bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">Apply</button>
        </div>
      </div>

      <div class="md:col-span-6 lg:col-span-4 space-y-2">
        <label class="text-[10px] font-bold uppercase opacity-50">Actual Price</label>
        <div class="relative">
          <input type="number" v-model.number="room.price" class="modern-input text-emerald-600 font-mono pr-8" placeholder="0">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 font-mono">₺</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import 'flatpickr/dist/flatpickr.min.css'
import flatpickr from 'flatpickr'
import { Turkish } from "flatpickr/dist/l10n/tr.js"

const props = defineProps(['room', 'roomTypes', 'canRemove'])
const emit = defineEmits(['remove'])

const dateInput = ref(null)
const suggestedPrice = ref(10000)

const applySuggested = () => { 
  props.room.price = suggestedPrice.value 
}

const fetchSuggestedPrice = async () => {
  // Your logic here: Call API with (props.room.type, props.room.dates, props.room.adults)
}

onMounted(() => {
  flatpickr(dateInput.value, {
    mode: "range",
    dateFormat: "j F Y (l)",
    locale: Turkish,
    defaultDate: props.room.dates || null,
    minDate: "today",
    onChange: (_, dateStr) => { 
      props.room.dates = dateStr
      fetchSuggestedPrice()
    }
  })
})
</script>

<style scoped>
@reference "../style.css";

.modern-input {
  @apply w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm;
}
</style>