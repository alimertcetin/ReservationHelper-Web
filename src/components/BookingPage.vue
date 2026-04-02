<template>
  <CustomModal 
    :show="modalActive"
    title="Load Reservation?"
    confirmText="Fill Form"
    @confirm="confirmLoad"
    @cancel="modalActive = false"
  >
    <template #message>
      Would you like to auto-fill the booking form with 
      <strong>{{ selectedResData?.name }} {{ selectedResData?.surname }}</strong>'s information?
    </template>
  </CustomModal>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden p-4">

    <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-y-auto custom-scrollbar">
      
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-2xl font-bold">{{ currentReservationId ? 'Edit Reservation' : 'New Booking' }}</h2>
          <p v-if="currentReservationId" class="text-xs font-mono text-teal-500 mt-1">
            MODIFIED ID: #{{ currentReservationId }} — {{ form.name }} {{ form.surname }}
          </p>
        </div>
        
        <button 
          @click="resetForm" 
          class="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 p-2 px-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>✕</span> Clear Form
        </button>
      </div>

      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase flex justify-between">
              Room Type
              <span v-if="isRoomTypesLoading" class="animate-spin text-[10px]">⌛</span>
            </label>
            <div v-if="isRoomTypesLoading" class="h-[46px] skeleton-box"></div>
            <select v-else v-model="form.roomType" class="modern-input">
              <option v-for="room in roomTypes" :key="room">{{ room }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-bold opacity-60 uppercase">Dates</label>
            <input 
              ref="dateInput" 
              v-model="form.dates" 
              :title="form.dates" 
              :class="['modern-input date-input-shrink', { 'text-xs-important': form.dates.length > 25 }]" 
              placeholder="Select Date"
            >
          </div>

          <div class="relative space-y-2" ref="guestContainer">
            <label class="text-xs font-bold opacity-60 uppercase">Guests</label>
            <div 
              tabindex="0"
              @click="guestDropdown = !guestDropdown" 
              class="modern-input cursor-pointer flex justify-between items-center outline-none"
            >
              <span>{{ form.adults }} Ad, {{ form.children }} Ch</span>
              <span class="text-[10px] transition-transform" :class="{'rotate-180': guestDropdown}">▼</span>
            </div>

            <div v-if="guestDropdown" class="absolute top-full left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-2 p-4 rounded-2xl shadow-2xl z-20 space-y-4">
              <div v-for="type in ['adults', 'children']" :key="type" class="flex justify-between items-center">
                <span class="font-bold capitalize">{{ type }}</span>
                <div class="flex items-center gap-3">
                  <button type="button" @click="changeGuest(type, -1)" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-teal-500 hover:text-white">-</button>
                  <span class="w-4 text-center font-mono">{{ form[type] }}</span>
                  <button type="button" @click="changeGuest(type, 1)" class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-teal-500 hover:text-white">+</button>
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
          <button @click="handleSave" class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold p-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all">
            {{ currentReservationId ? '💾 Update Changes' : '🏨 Confirm Reservation' }}
          </button>
          <button @click="$emit('whatsapp')" class="p-4 bg-emerald-500 text-white rounded-xl px-6">💬</button>
        </div>
      </div>
    </div>

    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
      
      <div class="px-2 space-y-3">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-lg">Recent Activity</h3>
          <button @click="fetchRecentActivity" class="text-xs text-teal-500 hover:underline">Refresh</button>
        </div>
        <input 
          v-model="searchQuery" 
          placeholder="Search name, phone or room..." 
          class="w-full p-2 px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
        >
      </div>

      <div class="space-y-3 overflow-y-auto custom-scrollbar pr-2">
        <template v-if="isRecentActivityLoading">
          <div v-for="i in 3" :key="i" class="p-4 m-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-800 shadow-sm">
            <div class="h-4 w-3/4 skeleton-box mb-3"></div>
            <div class="h-3 w-1/2 skeleton-box"></div>
          </div>
        </template>

        <TransitionGroup 
          v-else 
          name="list" 
          tag="div" 
          class="space-y-3"
        >
          <ActivityCard 
            v-for="(res, index) in filteredRecent" 
            :key="res.id" 
            :reservation="res" 
            @select="handleCardClick"
            :style="{ transitionDelay: `${index * 50}ms` }"
          />
          <div v-if="filteredRecent.length === 0" key="empty" class="text-center py-10 opacity-40 text-sm">
            No reservations found.
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { Turkish } from "flatpickr/dist/l10n/tr.js"
import ActivityCard from './ActivityCard.vue'
import CustomModal from './CustomModal.vue'

// Refs & Props
const props = defineProps(['form'])
const emit = defineEmits(['save', 'whatsapp'])

const dateInput = ref(null)
const guestContainer = ref(null)
const guestDropdown = ref(false)
const modalActive = ref(false)
const selectedResData = ref(null)

// Step 1: Search & Filtering
const searchQuery = ref("")
const recent = ref([])
const isRecentActivityLoading = ref(false)

// Step 2 & 4: Edit State
const currentReservationId = ref(null)

// Room Types
const roomTypes = ref([])
const isRoomTypesLoading = ref(false)

// Logic: Computed
const balance = computed(() => (props.form.total || 0) - (props.form.received || 0))

const filteredRecent = computed(() => {
  if (!searchQuery.value) return recent.value
  const q = searchQuery.value.toLowerCase()
  return recent.value.filter(res => 
    (res.name + " " + res.surname).toLowerCase().includes(q) ||
    res.name.toLowerCase().includes(q) || 
    res.surname.toLowerCase().includes(q) || 
    res.phone.includes(q) ||
    res.room.toLowerCase().includes(q)
  )
})

// Methods: Data Fetching
const fetchRoomTypes = async () => {
  isRoomTypesLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  roomTypes.value = ['Standard Room', 'Deluxe Suite', 'Family Room', 'King Suite', 'Bungalow']
  if (!props.form.roomType && roomTypes.value.length > 0) props.form.roomType = roomTypes.value[0]
  isRoomTypesLoading.value = false
}


const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const temp = [
    { id: 101, name: 'Mert', surname: 'Demir', time: Date.now(), room: 'King Suite', dates: '12 May 2026 - 15 May 2026', adults: 2, children: 1, total: 4500, phone: '5321234567' },
    { id: 102, name: 'Selin', surname: 'Akasya', time: Date.now() - (2 * HOUR), room: 'Standard Room', dates: '20 June 2026 - 22 June 2026', adults: 1, children: 0, total: 2100, phone: '5449876543' },
    { id: 103, name: 'Can', surname: 'Yilmaz', time: Date.now() - (1 * DAY), room: 'Bungalow', dates: '01 July 2026 - 05 July 2026', adults: 2, children: 2, total: 8000, phone: '5551112233' }
  ]


const fetchRecentActivity = async () => {
  isRecentActivityLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  if (recent.value.length == 0) recent.value.push(...temp)
  
  recent.value.sort((a, b) => b.time - a.time)
  isRecentActivityLoading.value = false
}

// Methods: Actions
const handleCardClick = (res) => {
  selectedResData.value = res
  modalActive.value = true
}

const confirmLoad = () => {
  const res = selectedResData.value
  if (res) {
    currentReservationId.value = res.id
    props.form.name = res.name
    props.form.surname = res.surname
    props.form.roomType = res.room
    props.form.dates = res.dates
    props.form.adults = res.adults
    props.form.children = res.children
    props.form.total = res.total
    props.form.phone = res.phone
    if (fp) fp.setDate(res.dates)
  }
  modalActive.value = false
}

const resetForm = () => {
  currentReservationId.value = null
  props.form.name = ""
  props.form.surname = ""
  props.form.phone = ""
  props.form.total = 0
  props.form.received = 0
  props.form.dates = ""
  props.form.adults = 2
  props.form.children = 0
  if (fp) fp.clear()
}

const handleSave = () => {
  if (currentReservationId.value) {
    // Step 4: Update time simulation
    const idx = recent.value.findIndex(r => r.id === currentReservationId.value)
    if(idx !== -1) {
      recent.value[idx].time = Date.now()
      recent.value[idx].name = props.form.name // reflect changes in list
      recent.value[idx].surname = props.form.surname
      recent.value[idx].phone = props.form.phone
      recent.value[idx].total = props.form.total
      recent.value[idx].received = props.form.received
      recent.value[idx].dates = props.form.dates
      recent.value[idx].adults = props.form.adults
      recent.value[idx].children = props.form.children
      // send to backend, re-trigger load
    }
    console.log("Updated reservation:", currentReservationId.value)
  } else {
    console.log("Saving new reservation")
  }
  fetchRecentActivity()
  emit('save')
}

// Event Listeners & Lifecycle
const handleClickOutside = (e) => {
  if (guestDropdown.value && guestContainer.value && !guestContainer.value.contains(e.target)) {
    guestDropdown.value = false
  }
}

const handleEsc = (e) => { if (e.key === 'Escape') guestDropdown.value = false }

const getRelativeTime = (timestamp) => {
  if (typeof timestamp === 'string') return timestamp; // Handle "Updated now" or "Yesterday"
  
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

let fp = null
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEsc)
  fetchRecentActivity()
  fetchRoomTypes()

  if (dateInput.value) {
    fp = flatpickr(dateInput.value, {
      mode: "range",
      dateFormat: "j F Y (l)",
      locale: { ...Turkish, firstDayOfWeek: 1 },
      monthSelectorType: "static",
      minDate: "today",
      onChange: (_, dateStr) => { props.form.dates = dateStr }
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEsc)
  if (fp) fp.destroy()
})

const changeGuest = (type, delta) => {
  if (type === 'adults') props.form.adults = Math.max(1, props.form.adults + delta)
  else props.form.children = Math.max(0, props.form.children + delta)
}

const formatCurrency = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)
}
</script>

<style>
.date-input-shrink { transition: font-size 0.2s ease; }
.text-xs-important { font-size: 0.75rem !important; }
</style>