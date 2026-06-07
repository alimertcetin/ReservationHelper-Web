<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950/50">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 max-w-[1600px] mx-auto">
      
      <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl h-fit">

        <div class="flex justify-between items-start mb-6">
          <div>
            <h2 class="text-2xl font-bold">{{ currentReservationId ? 'Edit Reservation' : 'New Booking' }}
              <button v-if="currentReservationId" @click="currentReservationId = null" class="text-xs text-blue-500 bg-slate-100 dark:bg-slate-800 hover:text-rose-500 p-2 px-3 rounded-lg transition-colors gap-2">
                <span>Cancel Edit <span class="text-[10px] animate-pulse">👈</span> </span>
              </button>
            </h2>
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
            <select v-model="form.staffId" class="compact-input font-bold dark:text-slate-200">
              <option v-for="type in staffMembers" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
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
                  :key="room.id"
                  v-model:room="form.rooms[index]"
                  :roomTypes="roomTypes"
                  :pricePolicies="pricePolicies" 
                  :canRemove="form.rooms.length > 1"
                  @remove="removeRoom(index)"
                />
              </TransitionGroup>
            </div>
          </section>

          <div class="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl space-y-6 border border-slate-100 dark:border-slate-800">
  
            <section class="space-y-3">
              <div class="flex justify-between items-center px-1">
                <h3 class="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Payments Breakdown</h3>
                <button @click="addPaymentItem()" class="text-teal-500 text-[10px] font-bold hover:underline">+ Add Payment Split</button>
              </div>
              
              <div class="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                <TransitionGroup name="list">
                  <PaymentItem 
                    v-for="(pay, index) in form.payments" 
                    :key="index"
                    v-model:paymentData="form.payments[index]"
                    :balance="balance"
                    :accounts="accounts"
                    :calculateTotalFromRooms="calculateTotalFromRooms"
                    @remove="removePaymentItem(index)"
                  />
                </TransitionGroup>
              </div>
            </section>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 items-end border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
              <div>
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Total Amount</label>
                <input type="number" v-model.number="form.total" class="financial-input">
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Total Received</label>
                <input type="number" :value="form.received" class="financial-input text-emerald-500" readonly disabled>
              </div>
              <div class="hidden md:block">
                <label class="text-[10px] uppercase font-bold opacity-50 block mb-2">Balance</label>
                <div :class="balance > 0 ? 'text-rose-500' : 'text-emerald-500'" class="text-xl font-mono pt-1">
                  {{ formatCurrency(balance) }}
                </div>
              </div>
              <div class="flex justify-end">
                <button @click="syncTotal" class="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-2 rounded-xl hover:scale-105 transition-all">
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
            <input v-model="searchQuery" placeholder="Search by name, phone number..." class="modern-input !rounded-xl text-sm">
          </div>

          <div class="space-y-3 overflow-y-auto px-2 custom-scrollbar flex-1">
            <ActivityCard 
              v-for="res in reservationsToDisplay"
              :key="res.id" 
              :reservation="res" 
              @select="handleCardClick(res)" 
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
        :show="fillFormModalActive" 
        title="Load Reservation?" 
        confirmText="Fill Form" 
        @confirm="confirmLoad" 
        @cancel="fillFormModalActive = false"
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import Handlebars from 'handlebars'
import { useToast } from '../composables/useToast'
import { bookingService } from '../services/api.js'

import RoomStayItem from './RoomStayItem.vue'
import ActivityCard from './ActivityCard.vue'
import CustomModal from './CustomModal.vue'
import PaymentItem from './PaymentItem.vue'

const form = defineModel('form')
const { showToast } = useToast()

const roomTypes = ref([])
const staffMembers = ref([])
const accounts = ref([])
const pricePolicies = ref([])
const availableTemplates = ref([])
const recent = ref([])

const currentReservationId = ref(null)
const searchQuery = ref("")
const showTemplateDropdown = ref(false)
const showPreviewModal = ref(false)
const fillFormModalActive = ref(false)
const selectedResData = ref(null)
const generatedText = ref("")
const selectedTemplate = ref(null)

const reservationsToDisplay = ref([])
let searchTimeout = null

// 1. Local filtering computed property
const filteredRecent = computed(() => {
  if (!searchQuery.value) return recent.value
  const q = searchQuery.value.toLowerCase()
  return recent.value.filter(p => 
    `${p.guest?.firstName} ${p.guest?.lastName}`.toLowerCase().includes(q)
  )
})

// 2. Drive UI view automatically from local cache when query changes
watch(filteredRecent, (newLocalResults) => {
  // If we have local matching results, or the search bar is empty, use them immediately
  if (newLocalResults.length > 0 || !searchQuery.value) {
    reservationsToDisplay.value = [...newLocalResults]
  }
}, { immediate: true })

// 3. Debounced API fallback watcher when local results turn up empty
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout)
  
  // If the query is completely wiped, the local watcher above handles resetting the array
  if (!newQuery.trim()) return

  searchTimeout = setTimeout(async () => {
    // ONLY ping the server database if our local recent activity cache doesn't match
    if (filteredRecent.value.length === 0) {
      try {
        console.log("============ MATCH NOT FOUND LOCALLY -> API CALL ============");
        const apiRes = await bookingService.searchReservation(newQuery)
        
        // Directly overwrite the array value so Vue detects the change cleanly (Avoid Object.assign)
        reservationsToDisplay.value = [...apiRes.data]
      } catch (err) {
        console.error("Search API failed:", err)
      }
    }
  }, 400) // 400ms debounce buffer prevents spamming your backend on every keypress
})

const balance = computed(() => {
  return (form.value.total || 0) - (form.value.received || 0);
});

const addDays = (originalDate, days) => {
    let date;
    if (typeof originalDate === 'string') {
      // Split the YYYY-MM-DD to avoid timezone shifting
      const [y, m, d] = originalDate.split('-').map(Number);
      date = new Date(y, m - 1, d); 
    } else {
      date = new Date(originalDate);
    }
    
    date.setDate(date.getDate() + days);
    
    // Return in YYYY-MM-DD format manually to be safe
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addRoom = () => {
  const lastRoom = form.value.rooms.at(-1);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  form.value.rooms.push({
    id: crypto.randomUUID(), // Use this for better uniqueness
    roomTypeId: lastRoom?.roomTypeId ?? roomTypes?.value[0]?.id ?? 0,
    // If there's a last room, copy its dates, otherwise use today/tomorrow
    checkIn: lastRoom?.checkIn ?? todayStr,
    checkOut: lastRoom?.checkOut ?? addDays(todayStr, 1),
    adults: lastRoom?.adults ?? 2,
    children: lastRoom?.children ?? 0,
    price: lastRoom?.price ?? 0
  });
};

const removeRoom = (index) => {
  if (form.value.rooms.length > 1) {
    form.value.rooms.splice(index, 1);
  }
};

const loadReservation = (data) => {
  // Mapping incoming DB data to our strict form state
  form.value.staffId = data.staffId;
  form.value.name = data.guest.firstName;
  form.value.surname = data.guest.lastName;
  form.value.phone = data.guest.phone;
  form.value.total = Number(data.totalAmount);
  form.value.received = Number(data.received || 0);
  form.value.rooms = data.rooms.map(r => ({
    id: r.id,
    roomTypeId: r.roomTypeId,
    checkIn: r.startDate.split('T')[0],
    checkOut: r.endDate.split('T')[0],
    adults: r.adults,
    children: r.children,
    price: Number(r.price)
  }));
  form.value.payments = [];
};

const calculateTotalFromRooms = computed(() => {
    return form.value.rooms.reduce((acc, room) => acc + (Number(room.price) || 0), 0);
  });

const syncTotal = () => {
  form.value.total = calculateTotalFromRooms();
}

const handleCardClick = (reservation) => {
  selectedResData.value = reservation;
  fillFormModalActive.value = true;
};

const confirmLoad = () => {
  if (selectedResData.value) {
    currentReservationId.value = selectedResData.value.id;
    
    loadReservation(selectedResData.value);
    fillFormModalActive.value = false;

    // We are waiting for DOM structure and child state to get reset using nextTick
    nextTick(() => {
      if (selectedResData.value.payments && selectedResData.value.payments.length > 0) {
        selectedResData.value.payments.forEach(payment => {
          form.value.payments.push({
            amount: payment.amount || null,
            method: payment.method || null,
            accountId: payment.accountId,
            reservationId: currentReservationId.value
          });
        });
      } else {
        addPaymentItem();
      }
    });
    
    showToast("Form Loaded", "Reservation data synced.");
  }
};

const openPreview = (tpl) => {
  try {
    const template = Handlebars.compile(tpl.content);
    console.log(JSON.stringify(form.value, null, 2));

    const data = {
      ...form.value,
      balance: balance.value,

      rooms: form.value.rooms?.map(r => ({
        ...r,
        type: roomTypes.value.find(t => t.id === r.roomTypeId)?.name || 'NULL'
      })) || [],

      staffName: staffMembers.value.find(p => p.id == form.value.staffId)?.name || 'NULL',

      payments: form.value.payments?.map(payment => {
        const account = accounts.value.find(acc => acc.id === payment.accountId);
        return {
          ...payment, // Keeps original payment fields (like amount)
          ...account
        };
      }) || []
    };

    generatedText.value = template(data);
    selectedTemplate.value = tpl;
    showPreviewModal.value = true;
    showTemplateDropdown.value = false;
  } catch (err) {
    console.error(err);
    showToast("Template Error", "Check Handlebars syntax", "error");
  }
};
const confirmAndSend = () => {
  const msg = encodeURIComponent(generatedText.value);
  const tpl = selectedTemplate.value;

  if (tpl.category === 'GUEST') {
    const phone = form.value.phone.replace(/\D/g, '');
    const finalPhone = phone.startsWith('5') ? `90${phone}` : phone;
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank');
  } else {
    navigator.clipboard.writeText(generatedText.value);
    showToast("Copied", "Opening WhatsApp...");
    window.open(`https://web.whatsapp.com/`, '_blank');
  }
  showPreviewModal.value = false;
};

const handleSave = async () => {
  try {
    const staff = staffMembers.value.find(s => s.id === form.value.staffId);
    console.log(JSON.stringify(form.value.payments, 0, 2));
    const payload = {
      guest: {
        firstName: form.value.name,
        lastName: form.value.surname,
        phone: form.value.phone,
      },
      staffId: staff?.id || null,
      totalAmount: form.value.total,
      payments: form.value.payments,
      rooms: form.value.rooms.map(r => ({
        roomTypeId: r.roomTypeId,
        startDate: r.checkIn,
        endDate: r.checkOut,
        adults: r.adults,
        children: r.children,
        price: r.price
      }))
    };

    if (!payload.guest.firstName || !payload.guest.lastName || !payload.guest.phone) throw new Error("Guest details required.");

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
  Object.assign(form.value, {
    name: "",
    surname: "",
    phone: "",
    total: 0,
    received: 0,
    staffId: staffMembers.value[0]?.id || -1,
    rooms: [],
    payments: []
  });
  addRoom();
};

const addPaymentItem = (payment = null) => {
  if (!form.value.payments) form.value.payments = [];
  
  form.value.payments.push({
    amount: payment ? payment.amount : null,
    method: payment ? payment.method : null,
    accountId: payment ? payment.accountId : null,
    reservationId: currentReservationId.value || -1,
  });
};

const removePaymentItem = (index) => {
  form.value.payments.splice(index, 1);
};

const computedReceivedTotal = computed(() => {
  if (!form.value.payments) return 0;
  return form.value.payments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
});

const computedTotalPrice = computed(() => {
  if (!form.value.rooms) return 0;
  return form.value.rooms.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
});

watch(computedReceivedTotal, (newVal) => {
  form.value.received = newVal;
});

watch(computedTotalPrice, (newVal) => {
  form.value.total = newVal;
});

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
    
    // Initial sync: display the recent bookings right away
    reservationsToDisplay.value = [...recent.value]

    if (form.value.rooms.length === 0) addRoom();

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