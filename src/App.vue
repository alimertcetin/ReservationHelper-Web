<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
    
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"></div>

    <aside :class="['-translate-x-full', { 'translate-x-0': sidebarOpen }]" 
           class="fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 z-50 transition-transform duration-300 border-r border-slate-200 dark:border-slate-800 shadow-2xl">
      <div class="p-6 flex flex-col h-full">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-xl font-bold text-teal-500">Menu</h2>
          <button @click="sidebarOpen = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">✕</button>
        </div>
        <nav class="space-y-2">
          <button v-for="item in menu" :key="item.id" 
                  @click="currentPage = item.id; sidebarOpen = false"
                  :class="['w-full flex items-center gap-3 p-3 rounded-xl transition-all', 
                           currentPage === item.id ? 'bg-teal-500 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800']">
            <span>{{ item.icon }}</span> {{ item.label }}
          </button>
        </nav>
      </div>
    </aside>

    <nav class="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
      <div class="max-w-[1600px] mx-auto flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button @click="sidebarOpen = true" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">☰</button>
          <h1 class="text-lg font-bold">Reservation<span class="text-teal-500">Pro</span></h1>
        </div>
        <div class="flex items-center gap-4">
          <button @click="toggleDark" class="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:scale-110 transition-transform">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <div class="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">A</div>
        </div>
      </div>
    </nav>

    <main class="max-w-[1600px] mx-auto p-4 md:p-6 min-h-[calc(100vh-68px)]">
        <BookingPage v-if="currentPage === 'bookings'" :form="form" />
        <StaffManagement v-else-if="currentPage === 'staff'" />
        <PriceManager v-else-if="currentPage === 'priceManager'" :form="form" />
        <AccountManagement v-else-if="currentPage === 'accountManagement'" :form="form" />
        
        <div v-else class="flex items-center justify-center h-96 opacity-30">
            <h2 class="text-3xl font-bold italic">{{ currentPage }} page coming soon...</h2>
        </div>
    </main>

    <TheToast />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import BookingPage from './components/BookingPage.vue'
import StaffManagement from './components/StaffManagement.vue'
import PriceManager from './components/PriceManager.vue'
import AccountManagement from './components/AccountManagement.vue'
import TheToast from './components/TheToast.vue'

const isDark = ref(false)
const sidebarOpen = ref(false)
const currentPage = ref('bookings')

const menu = [
  { id: 'bookings', label: 'New Booking', icon: '🏨' },
  { id: 'rooms', label: 'Room List', icon: '🛏️' },
  { id: 'accounts', label: 'Bank Info', icon: '💳' },
  { id: 'staff', label: 'Staff Management', icon: 'o.o' },
  { id: 'priceManager', label: 'Price Manager', icon: '$' },
  { id: 'accountManagement', label: 'Account Management', icon: '£' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
]

// Global form state if you want it to persist between menu switches
const form = reactive({
  name: '',
  surname: '',
  phone: '',
  staffId: -1,
  rooms: [],
  total: 0,
  received: 0
})

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark')
}
</script>