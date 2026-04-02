<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden p-4">
    
    <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-y-auto custom-scrollbar">
      
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-2xl font-bold">{{ currentReservationId ? 'Edit Reservation' : 'New Booking' }}</h2>
          <p v-if="currentReservationId" class="text-xs font-mono text-teal-500 mt-1 uppercase">
            ID: #{{ currentReservationId }} — {{ form.name }}
          </p>
        </div>
        
        <button @click="resetForm" class="text-xs bg-slate-100 dark:bg-slate-800 hover:text-rose-500 p-2 px-3 rounded-lg transition-colors flex items-center gap-2">
          <span>✕</span> Clear Form
        </button>
      </div>

      <div class="space-y-8">
        <div class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <label class="text-[10px] font-bold uppercase opacity-60 mb-2 block">Handled By (Staff)</label>
          <div class="flex gap-2">
            <input v-model="form.staffName" list="staffList" class="modern-input" placeholder="Type or select staff name...">
            <datalist id="staffList">
              <option v-for="user in staffMembers" :key="user.id" :value="user.name" />
            </datalist>
          </div>
        </div>

        <section class="space-y-4">
          <h3 class="font-bold text-slate-500 uppercase text-xs tracking-widest">Guest Information</h3>
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
        </section>

        <section class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-slate-500 uppercase text-xs tracking-widest">Room Stays</h3>
            <button @click="addRoom" class="text-teal-500 text-xs font-bold hover:underline">+ Add Another Stay</button>
          </div>

          <TransitionGroup name="list">
            <RoomStayItem 
              v-for="(room, index) in form.rooms" 
              :key="room.id" 
              :room="room" 
              :roomTypes="roomTypes"
              :canRemove="form.rooms.length > 1"
              @remove="removeRoom(index)"
            />
          </TransitionGroup>

          <div class="flex justify-end pt-2">
            <button @click="calculateTotalFromRooms" class="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-full hover:scale-105 transition-all">
              🔄 Sync Room Prices to Total
            </button>
          </div>
        </section>

        <div class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl grid grid-cols-3 gap-6">
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Total Amount</label>
            <input type="number" v-model.number="form.total" class="financial-input">
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Received</label>
            <input type="number" v-model.number="form.received" class="financial-input text-emerald-500">
          </div>
          <div>
            <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Balance</label>
            <div :class="balance > 0 ? 'text-rose-500' : 'text-emerald-500'" class="text-xl font-mono pt-1">
              {{ formatCurrency(balance) }}
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 pt-4">
          <button @click="handleSave" class="flex-1 min-w-[200px] bg-teal-500 hover:bg-teal-600 text-white font-bold p-4 rounded-xl shadow-lg transition-all">
            {{ currentReservationId ? '💾 Update Changes' : '🏨 Confirm Reservation' }}
          </button>
          <button @click="generateMessage('guest')" class="btn-icon bg-emerald-500">👤 Guest Msg</button>
          <button @click="generateMessage('reception')" class="btn-icon bg-slate-700">🛎️ Staff Msg</button>
        </div>
      </div>
    </div>

    <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar p-1">
      <div class="px-2 space-y-3">
        <h3 class="font-bold text-lg">Recent Activity</h3>
        <input v-model="searchQuery" placeholder="Search..." class="modern-input !rounded-xl text-sm">
      </div>

      <div class="space-y-3 overflow-y-auto pr-2">
        <ActivityCard v-for="res in filteredRecent" :key="res.id" :reservation="res" @select="handleCardClick" />
      </div>
    </div>

    <CustomModal :show="showPreviewModal" title="Message Preview" confirmText="Copy" @confirm="copyToClipboard" @cancel="showPreviewModal = false">
      <template #message>
        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{ generatedText }}</pre>
        </div>
      </template>
    </CustomModal>

    <CustomModal 
      :show="modalActive" 
      title="Load Reservation?" 
      confirmText="Fill Form" 
      @confirm="confirmLoad" 
      @cancel="modalActive = false"
    >
      <template #message>
        Would you like to auto-fill the form with 
        <strong>{{ selectedResData?.name }} {{ selectedResData?.surname }}</strong>'s information?
      </template>
    </CustomModal>


  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Handlebars from 'handlebars'
import { messageTemplates } from '../utils/templates.js'
import { useToast } from '../composables/useToast'
import { useBookingLogic } from '../composables/useBookingLogic'

// Components
import RoomStayItem from './RoomStayItem.vue'
import ActivityCard from './ActivityCard.vue'
import CustomModal from './CustomModal.vue'

const props = defineProps(['form'])
const emit = defineEmits(['save'])
const { showToast } = useToast()

// Config
const roomTypes = ref(['Standard Room', 'Deluxe Suite', 'Family Room', 'King Suite', 'Bungalow'])
const staffMembers = ref([{ id: 1, name: 'Ahmet Y.' }, { id: 2, name: 'Selin K.' }])

// Logic Composable
const { balance, addRoom, removeRoom, calculateTotalFromRooms, loadReservation } = useBookingLogic(props.form, roomTypes.value)

// Local State
const showPreviewModal = ref(false)
const generatedText = ref("")
const searchQuery = ref("")
const recent = ref([])
const currentReservationId = ref(null)
const modalActive = ref(false)
const selectedResData = ref(null)

// Computed
const filteredRecent = computed(() => {
  if (!searchQuery.value) return recent.value
  const q = searchQuery.value.toLowerCase()
  return recent.value.filter(res => (res.name + " " + res.surname).toLowerCase().includes(q))
})

// 2. Add the missing handleCardClick function
const handleCardClick = (res) => {
  console.log("Card clicked:", res);
  selectedResData.value = res;
  modalActive.value = true; // This opens the CustomModal
}

// 3. Ensure confirmLoad is correctly implemented
const confirmLoad = () => {
  if (selectedResData.value) {
    // Set the ID for the "Edit" header
    currentReservationId.value = selectedResData.value.id;
    
    // Use the composable logic to fill the form
    loadReservation(selectedResData.value);
    
    // Close modal
    modalActive.value = false;
    showToast("Form Loaded", `${selectedResData.value.name}'s data is ready.`);
  }
};
// UI Actions
const generateMessage = (templateKey) => {
  const template = Handlebars.compile(messageTemplates[templateKey])
  generatedText.value = template({ ...props.form, balance: balance.value })
  showPreviewModal.value = true
}

const copyToClipboard = async () => {
  await navigator.clipboard.writeText(generatedText.value)
  showPreviewModal.value = false
  showToast("Copied!", "Ready to send on WhatsApp.")
}

const handleSave = () => {
  showToast("Saved!", "Database record updated.")
  emit('save')
}

const resetForm = () => {
  currentReservationId.value = null
  props.form.name = ""; props.form.surname = ""; props.form.phone = "";
  props.form.total = 0; props.form.received = 0;
  props.form.rooms = [{ id: Date.now(), type: roomTypes.value[0], dates: '', adults: 2, children: 0, price: 0 }]
}

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

onMounted(async () => {
  // Fetch activity logic...
  recent.value = [{ id: 101, name: 'Mert', surname: 'Demir', time: Date.now(), rooms: [{type: 'King Suite', price: 20000}], total: 20000 }]
})
</script>

<style scoped>
/* 1. Add this line (update the path to match your main CSS file) */
@reference "../style.css"; 

.modern-input {
  @apply w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm;
}

.financial-input {
  @apply w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-xl font-mono outline-none focus:border-teal-500;
}

.btn-icon {
  @apply flex items-center gap-2 p-4 text-white rounded-xl px-6 font-bold transition-transform active:scale-95;
}

/* Standard CSS doesn't need @apply or @reference */
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>