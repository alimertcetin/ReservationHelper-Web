<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950/50">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 max-w-[1600px] mx-auto">
      
      <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl h-fit">

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
            <input v-model="form.staffName" list="staffList" class="modern-input" placeholder="Type or select staff name...">
            <datalist id="staffList">
              <option v-for="user in staffMembers" :key="user.id" :value="user.name" />
            </datalist>
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

          <section class="space-y-3">
            <div class="flex justify-between items-center px-1">
              <h3 class="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Room Stays</h3>
              <button @click="addRoom" class="text-teal-500 text-[10px] font-bold hover:underline">+ Add Another</button>
            </div>
            <div class="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
              <TransitionGroup name="list">
                <RoomStayItem 
                  v-for="(room, index) in form.rooms" 
                  :key="room.renderKey || index"
                  :room="room" 
                  :roomTypes="roomTypes"
                  :pricePolicies="pricePolicies" 
                  :canRemove="form.rooms.length > 1"
                  @remove="removeRoom(index)"
                />
              </TransitionGroup>
            </div>
          </section>

          <div class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl space-y-6 border border-slate-100 dark:border-slate-800">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[9px] font-bold uppercase opacity-40">Target Account</label>
                <select v-model="selectedAccountId" class="modern-input">
                  <option v-for="account in accounts" :key="account.id" :value="account.id">
                    {{ account.owner?.name }} - {{ account.displayName }} ({{ account.type }})
                  </option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[9px] font-bold uppercase opacity-40">Payment Method</label>
                <select v-model="form.paymentMethod" class="modern-input">
                  <option v-for="method in filteredMethods" :key="method" :value="method">
                    {{ method.replace('_', ' ') }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
              <div>
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Total Amount</label>
                <input type="number" v-model.number="form.total" class="financial-input">
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Received</label>
                <input type="number" v-model.number="form.received" class="financial-input text-emerald-500">
              </div>
              <div class="hidden md:block">
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Balance</label>
                <div :class="balance > 0 ? 'text-rose-500' : 'text-emerald-500'" class="text-xl font-mono pt-1">
                  {{ formatCurrency(balance) }}
                </div>
              </div>
              <div class="flex justify-end">
                <button @click="calculateTotalFromRooms" class="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-xl hover:scale-105 transition-all">
                  🔄 Sync Prices
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-4 mt-4">
            <button @click="handleSave" class="flex-1 min-w-[200px] bg-teal-500 hover:bg-teal-600 text-white font-bold p-4 rounded-xl shadow-lg transition-all active:scale-95">
              {{ currentReservationId ? '💾 Update Changes' : '🏨 Confirm Reservation' }}
            </button>

            <div class="relative">
              <button @click="showTemplateDropdown = !showTemplateDropdown" 
                      class="btn-icon bg-emerald-500 hover:bg-emerald-600 h-full">
                📱 Send Message ▾
              </button>
              
              <div v-if="showTemplateDropdown" 
                   class="absolute bottom-full mb-2 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div class="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <span class="text-[10px] font-black uppercase opacity-50">Select Template</span>
                </div>
                <div class="max-h-64 overflow-y-auto custom-scrollbar">
                  <button v-for="tpl in availableTemplates" :key="tpl.id" 
                          @click="openPreview(tpl)"
                          class="w-full text-left p-4 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-b last:border-none border-slate-50 dark:border-slate-800">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-xs">{{ tpl.name }}</span>
                      <span :class="tpl.category === 'GUEST' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30'" 
                            class="text-[8px] font-black border px-1.5 py-0.5 rounded uppercase">
                        {{ tpl.category }}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4">
        <div class="sticky top-4 flex flex-col gap-4 h-[calc(100vh-2rem)]">
          <div class="px-2 space-y-3">
            <h3 class="font-bold text-lg">Recent Activity</h3>
            <input v-model="searchQuery" placeholder="Search by name..." class="modern-input !rounded-xl text-sm">
          </div>

          <div class="space-y-3 overflow-y-auto px-2 custom-scrollbar flex-1">
            <ActivityCard 
              v-for="res in filteredRecent" 
              :key="res.id" 
              :reservation="res" 
              @select="handleCardClick" 
            />
          </div>
        </div>
      </div>

      <CustomModal 
        :show="showPreviewModal" 
        title="Message Preview" 
        confirmText="Open WhatsApp" 
        @confirm="confirmAndSend" 
        @cancel="showPreviewModal = false"
      >
        <template #message>
          <div class="bg-slate-950 text-emerald-400 p-6 rounded-2xl font-mono text-xs leading-relaxed border border-emerald-500/20 shadow-inner max-h-[400px] overflow-y-auto">
            <pre class="whitespace-pre-wrap">{{ generatedText }}</pre>
          </div>
          <p class="mt-3 text-[10px] text-slate-400 italic">Review the content above before jumping to WhatsApp.</p>
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
          <strong>{{ selectedResData?.guest?.firstName }} {{ selectedResData?.guest?.lastName }}</strong>'s information?
        </template>
      </CustomModal>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import Handlebars from 'handlebars'
import { useToast } from '../composables/useToast'
import { useBookingLogic } from '../composables/useBookingLogic'
import { bookingService } from '../services/api.js'

import RoomStayItem from './RoomStayItem.vue'
import ActivityCard from './ActivityCard.vue'
import CustomModal from './CustomModal.vue'

const props = defineProps(['form'])
const { showToast } = useToast()

// State
const roomTypes = ref([])
const staffMembers = ref([])
const accounts = ref([])
const pricePolicies = ref([])
const availableTemplates = ref([])
const recent = ref([])

const currentReservationId = ref(null)
const selectedAccountId = ref(null)
const searchQuery = ref("")
const showTemplateDropdown = ref(false)
const showPreviewModal = ref(false)
const modalActive = ref(false)
const selectedResData = ref(null)
const generatedText = ref("")
const selectedTemplate = ref(null)

// Logic Composable
const { balance, addRoom, removeRoom, calculateTotalFromRooms, loadReservation } = useBookingLogic(props.form, roomTypes);

// Mapping for Payment Methods based on account type (Matches Backend)
const ACCOUNT_METHOD_MAP = {
  CASH: ['CASH'],
  BANK: ['CREDIT_CARD', 'BANK_TRANSFER', 'ONLINE'],
  VIRTUAL: ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'ONLINE']
};

const filteredMethods = computed(() => {
  const acc = accounts.value.find(a => a.id === selectedAccountId.value);
  if (!acc) return [];
  return ACCOUNT_METHOD_MAP[acc.type] || [];
});

// Watch account change to set default method
watch(selectedAccountId, (newId) => {
  const acc = accounts.value.find(a => a.id === newId);
  if (acc) {
    props.form.paymentMethod = acc.type === 'CASH' ? 'CASH' : props.form.paymentMethod === 'BANK' ? 'BANK_TRANSFER' : 'ONLINE';
  }
});

const filteredRecent = computed(() => {
  if (!searchQuery.value) return recent.value
  const q = searchQuery.value.toLowerCase()
  return recent.value.filter(res => 
    `${res.guest?.firstName} ${res.guest?.lastName}`.toLowerCase().includes(q)
  )
});

// Loading Reservation
const handleCardClick = (reservation) => {
  selectedResData.value = reservation;
  modalActive.value = true;
};

const confirmLoad = () => {
  if (selectedResData.value) {
    currentReservationId.value = selectedResData.value.id;
    loadReservation(selectedResData.value);
    modalActive.value = false;
    showToast("Form Loaded", "Reservation data synced.");
  }
};

// Messaging
const openPreview = (tpl) => {
  try {
    const template = Handlebars.compile(tpl.content);
    const data = {
      ...props.form,
      balance: balance.value,
      account: accounts.value.find(a => a.id === selectedAccountId.value) || {},
      rooms: props.form.rooms.map(r => ({
        ...r,
        type: roomTypes.value.find(t => t.id === r.roomTypeId)?.name || 'Room'
      }))
    };
    generatedText.value = template(data);
    selectedTemplate.value = tpl;
    showPreviewModal.value = true;
    showTemplateDropdown.value = false;
  } catch (err) {
    showToast("Template Error", "Check Handlebars syntax", "error");
  }
};

const confirmAndSend = () => {
  const msg = encodeURIComponent(generatedText.value);
  const tpl = selectedTemplate.value;

  if (tpl.category === 'GUEST') {
    const phone = props.form.phone.replace(/\D/g, '');
    const finalPhone = phone.startsWith('5') ? `90${phone}` : phone;
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank');
  } else {
    navigator.clipboard.writeText(generatedText.value);
    showToast("Copied", "Opening WhatsApp...");
    window.open(`https://web.whatsapp.com/`, '_blank');
  }
  showPreviewModal.value = false;
};

// Persistence
const handleSave = async () => {
  try {
    const staff = staffMembers.value.find(s => s.name === props.form.staffName);
    const payload = {
      guest: {
        firstName: props.form.name,
        lastName: props.form.surname,
        phone: props.form.phone,
      },
      staffId: staff.id,
      totalAmount: props.form.total,
      received: props.form.received,
      accountId: selectedAccountId.value,
      method: props.form.paymentMethod,
      rooms: props.form.rooms.map(r => ({
        roomTypeId: r.roomTypeId,
        startDate: r.checkIn,
        endDate: r.checkOut,
        adults: r.adults,
        children: r.children,
        price: r.price
      }))
    };

    let response;
    if (currentReservationId.value) {
      response = await bookingService.updateReservation(currentReservationId.value, payload);
    } else {
      response = await bookingService.createReservation(payload);
    }

    showToast("Success", `Reservation #${response.data.id} saved.`);
    fetchRecent();
    if(!currentReservationId.value) resetForm();
  } catch (error) {
    showToast("Error", error.message, "error");
  }
};

const resetForm = () => {
  currentReservationId.value = null;
  Object.assign(props.form, {
    name: "", surname: "", phone: "", total: 0, received: 0, staffName: "",
    paymentMethod: "CASH",
    rooms: []
  });
  addRoom();
};

const fetchRecent = async () => {
  const res = await bookingService.getRecentBookings();
  recent.value = res.data;
};

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

onMounted(async () => {
  try {
    const [recentRes, staffRes, roomTypeRes, accountsRes, policiesRes, templatesRes] = await Promise.all([
      bookingService.getRecentBookings(),
      bookingService.getStaff(),
      bookingService.getRoomTypes(),
      bookingService.getAccounts(),
      bookingService.getPolicies(),
      bookingService.getTemplates()
    ]);

    recent.value = recentRes.data;
    staffMembers.value = staffRes.data;
    roomTypes.value = roomTypeRes.data;
    accounts.value = accountsRes.data;
    pricePolicies.value = policiesRes.data;
    availableTemplates.value = templatesRes.data;

    if (accounts.value.length > 0) {
      selectedAccountId.value = accounts.value[0].id;
    }

    if (props.form.rooms.length === 0) addRoom();

  } catch (err) {
    showToast("Error", "Initialization failed", "error");
  }
});
</script>

<style scoped>
@reference "../style.css"; 

.modern-input {
  @apply w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-xs;
}

.financial-input {
  @apply w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-700 text-xl font-mono outline-none focus:border-teal-500;
}

.btn-icon {
  @apply flex items-center gap-2 p-4 text-white rounded-xl px-6 font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-500/20;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-700 rounded-full; }

.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(10px); }
</style>