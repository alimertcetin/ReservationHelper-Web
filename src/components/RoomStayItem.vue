<template>
  <div class="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm relative group mb-3 transition-all hover:border-slate-200 dark:hover:border-slate-700">
    
    <button 
      v-if="canRemove" 
      @click="$emit('remove')" 
      class="absolute top-1 right-1 w-6 h-6 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[10px] z-20 transition-all flex items-center justify-center"
    >
      ✕
    </button>
    
    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div class="md:col-span-4 space-y-1">
        <label class="text-[9px] font-bold uppercase opacity-40">Room Type</label>
        <select v-model="room.type" class="modern-input-sm" @change="fetchSuggestedPrice">
          <option v-for="type in roomTypes" :key="type">{{ type }}</option>
        </select>
      </div>

      <div class="md:col-span-5 space-y-1">
        <label class="text-[9px] font-bold uppercase opacity-40">Stay Dates</label>
        <input ref="dateInput" :value="room.dates" class="modern-input-sm cursor-pointer" placeholder="Select Dates" readonly>
      </div>

      <div class="md:col-span-3 flex items-end gap-1">
        <div class="flex-1 flex flex-col items-center bg-slate-50 dark:bg-slate-800 rounded-xl py-1 border border-slate-100 dark:border-slate-700">
          <p class="text-[9px] uppercase font-bold opacity-40">Yetişkin</p>
          <div class="flex items-center gap-2 justify-between mt-1">
            <button @click="room.adults = Math.max(1, room.adults - 1)" class="text-teal-500 px-2 hover:bg-teal-500/10 rounded">-</button>
            <span class="font-mono font-bold text-xs">{{ room.adults }}</span>
            <button @click="room.adults++" class="text-teal-500 px-2 hover:bg-teal-500/10 rounded">+</button>
          </div>
        </div>
        <div class="flex-1 flex flex-col items-center bg-slate-50 dark:bg-slate-800 rounded-xl py-1 border border-slate-100 dark:border-slate-700">
          <p class="text-[9px] uppercase font-bold opacity-40">Çocuk</p>
          <div class="flex items-center gap-2 justify-between mt-1">
            <button @click="room.children = Math.max(0, room.children - 1)" class="text-teal-500 px-2 hover:bg-teal-500/10 rounded">-</button>
            <span class="font-mono font-bold text-xs">{{ room.children }}</span>
            <button @click="room.children++" class="text-teal-500 px-2 hover:bg-teal-500/10 rounded">+</button>
          </div>
        </div>
      </div>

      <div class="md:col-span-6 space-y-1">
        <label class="text-[9px] font-bold uppercase text-blue-500 opacity-60">Suggested Price</label>
        <div class="modern-input-sm bg-blue-50/30 dark:bg-blue-900/10 border-blue-100/50 flex items-center justify-between py-1.5">
          <span class="font-mono font-bold text-blue-600 text-xs">{{ suggestedPrice }}₺</span>
          <button @click="applySuggested" class="text-[8px] bg-blue-600 text-white px-2 py-0.5 rounded-md hover:bg-blue-700 transition-colors">Apply</button>
        </div>
      </div>

      <div class="md:col-span-6 space-y-1">
        <label class="text-[9px] font-bold uppercase opacity-40">Actual Price</label>
        <div class="relative">
          <input type="number" v-model.number="room.price" class="modern-input-sm text-emerald-600 font-mono pr-6" placeholder="0">
          <span class="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 font-mono text-xs">₺</span>
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
import { bookingService } from "../services/api.js";

const props = defineProps(['room', 'roomTypes', 'canRemove'])
const emit = defineEmits(['remove'])

const dateInput = ref(null)
const suggestedPrice = ref(10000)

const applySuggested = () => { 
  props.room.price = suggestedPrice.value 
}

const fetchSuggestedPrice = async () => {
  console.log(props);
  console.log(props.room);
  console.log(props.room.dates);
  console.log(props.roomTypes);
  // console.log("fetchSuggestedPrice: " + response);
  // Your logic here: Call API with (props.room.type, props.room.dates, props.room.adults)

}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

onMounted(() => {
  flatpickr(dateInput.value, {
    mode: "range",
    dateFormat: "j F Y (l)",
    locale: Turkish,
    defaultDate: props.room.dates || null,
    minDate: "today",
    onChange: (selectedDates, dateStr, instance) => { 
      if (selectedDates.length > 1) 
      {
        const [start, end] = selectedDates;
        props.room.dates = [
          formatDate(start),
          formatDate(end)
        ];
        fetchSuggestedPrice();
      }
    }
  })
})
</script>

<style scoped>
@reference "../style.css";

.modern-input-sm {
  @apply w-full p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-xs;
}
</style>