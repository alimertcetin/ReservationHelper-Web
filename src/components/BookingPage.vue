<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden p-4">

    <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-y-auto custom-scrollbar">
      <h2 class="text-2xl font-bold mb-6">New Booking</h2>

      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase">Room Type</label>
            <select v-model="form.roomType" class="modern-input">
              <option v-for="room in ['Standard Room', 'Deluxe Suite', 'Family Room', 'King Suite']" :key="room">{{ room }}</option>
            </select>
          </div>
          <div class="space-y-2">
          <label class="text-xs font-bold opacity-60 uppercase">Dates</label>
          <input 
            ref="dateInput" 
            v-model="form.dates" 
            :title="form.dates" 
            :class="[
              'modern-input date-input-shrink', 
              { 'text-xs-important': form.dates.length > 25 } 
            ]" 
            placeholder="Select Date"
          >
          </div>

          <div class="relative space-y-2" ref="guestContainer">
            <label class="text-xs font-bold opacity-60 uppercase">Guests</label>
            <div 
            tabindex="0"
            @click="guestDropdown = !guestDropdown" 
            @keydown.enter.prevent="guestDropdown = !guestDropdown"
            @keydown.space.prevent="guestDropdown = !guestDropdown"
            class="modern-input cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-teal-500 outline-none">
            <span>{{ form.adults }} Ad, {{ form.children }} Ch</span>
            <span class="text-[10px] transition-transform" :class="{'rotate-180': guestDropdown}">▼</span>
            </div>


            <div v-if="guestDropdown" class="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-2 p-4 rounded-2xl shadow-2xl z-20 space-y-4">
              <div v-for="type in ['adults', 'children']" :key="type" class="flex justify-between items-center">
                <span class="font-bold capitalize">{{ type }}</span>
                <div class="flex items-center gap-3">
                  <button 
                    type="button"
                    @click="changeGuest(type, -1)" 
                    class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-teal-500 hover:text-white transition-colors"
                  >-</button>
                  
                  <span class="w-4 text-center font-mono">{{ form[type] }}</span>
                  
                  <button 
                    type="button"
                    @click="changeGuest(type, 1)" 
                    class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-teal-500 hover:text-white transition-colors"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase">First Name</label>
            <input v-model="form.name" class="modern-input" placeholder="Name">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase">Surname</label>
            <input v-model="form.surname" class="modern-input" placeholder="Surname">
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase">Phone</label>
            <input v-model="form.phone" class="modern-input" placeholder="5xx...">
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl grid grid-cols-3 gap-6">
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Total Amount</label>
            <input type="number" v-model="form.total" class="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-xl font-mono outline-none focus:border-teal-500">
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Received</label>
            <input type="number" v-model="form.received" class="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-xl font-mono text-emerald-500 outline-none focus:border-emerald-500">
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Balance</label>
            <div :class="balance > 0 ? 'text-rose-500' : 'text-emerald-500'" class="text-xl font-mono pt-1">
              {{ formatCurrency(balance) }}
            </div>
          </div>
        </div>

        <div class="flex gap-4 pt-4">
          <button @click="$emit('save')" class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold p-4 rounded-xl shadow-lg shadow-teal-500/20">
            🏨 Confirm Reservation
          </button>
          <button @click="$emit('whatsapp')" class="p-4 bg-emerald-500 text-white rounded-xl px-6">💬</button>
        </div>
      </div>
    </div>
    

    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
      <h3 class="font-bold text-lg px-2">Recent Activity</h3>
      <div class="space-y-3 overflow-y-auto custom-scrollbar pr-2">
       <div v-for="res in recent" :key="res.id" class="recent-card m-1">
          <h4 class="font-bold text-teal-600 text-sm">{{ res.name }} {{ res.surname }}</h4>
          <p class="text-[10px] opacity-60">{{ res.room }} • {{ res.time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
// 1. Import the Turkish locale specifically
import { Turkish } from "flatpickr/dist/l10n/tr.js"

const guestContainer = ref(null)
const guestDropdown = ref(false)

const handleClickOutside = (event) => {
  // If the dropdown is open AND the click was NOT inside the container, close it
  if (guestDropdown.value && guestContainer.value && !guestContainer.value.contains(event.target)) {
    guestDropdown.value = false
  }
}

const handleEsc = (event) => {
  if (event.key === 'Escape') guestDropdown.value = false
}


let fp = null
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEsc)
  if (dateInput.value) {
    fp = flatpickr(dateInput.value, {
      mode: "range",
      /*dateFormat: "l, F j, Y", // Example: "Sunday, January 15, 2024"*/
      /*dateFormat: "d.m.y(l)",*/
      dateFormat: "j F Y (l)",
      // 2. Apply the locale and start of week here
      locale: {
        ...Turkish,
        firstDayOfWeek: 1 // Monday
      },
      // 3. Disable the "Ugly" dropdowns to keep the UI clean
      monthSelectorType: "static", 
      showMonths: 1,
      minDate: "today",
      onChange: (_, dateStr) => { props.form.dates = dateStr }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEsc)

  if (fp) fp.destroy() // Clean up when user leaves the page
})

const props = defineProps(['form'])
defineEmits(['save', 'whatsapp'])

const dateInput = ref(null)
const recent = ref([
  { id: 1, name: 'Mert', surname: 'Demir', time: 'Just now', room: 'King Suite' },
  { id: 2, name: 'Selin', surname: 'Akasya', time: '2h ago', room: 'Standard' }
])

const balance = computed(() => (props.form.total || 0) - (props.form.received || 0))

const changeGuest = (type, delta) => {
  if (type === 'adults') props.form.adults = Math.max(1, props.form.adults + delta)
  else props.form.children = Math.max(0, props.form.children + delta)
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
}

</script>


<style>
/* Specific fix for the Date Input to handle long range strings */
.date-input-shrink {
  font-size: 0.875rem; /* Default text-sm */
  transition: font-size 0.2s ease;
}

/* If the text is likely very long (detected by character count) 
   we can drop the size slightly via a class */
.text-xs-important {
  font-size: 0.75rem !important; /* text-xs */
}

</style>