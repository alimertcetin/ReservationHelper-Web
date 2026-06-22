<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950/50">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 max-w-[1600px] mx-auto">
      
      <div class="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg h-fit">

        <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-lg font-bold flex items-center gap-2">
              {{ currentReservationId ? 'Edit Reservation' : 'New Booking' }}
              <button v-if="currentReservationId" @click="currentReservationId = null" class="text-[10px] text-blue-500 bg-slate-100 dark:bg-slate-800 hover:text-rose-500 py-1 px-2 rounded transition-colors flex items-center gap-1">
                Cancel Edit <span class="text-[9px] animate-pulse">👈</span>
              </button>
            </h2>
            <p v-if="currentReservationId" class="text-[10px] font-mono text-teal-500 uppercase">
              ID: #{{ currentReservationId }} — {{ bookingForm.name }}
            </p>
          </div>
          <button @click="resetForm" class="text-[10px] bg-slate-100 dark:bg-slate-800 hover:text-rose-500 py-1 px-2.5 rounded transition-colors flex items-center gap-1">
            ✕ Clear
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div class="md:col-span-3">
              <label class="text-[10px] font-bold uppercase opacity-60 mb-1 block">Staff</label>
              <select v-model="bookingForm.staff" class="compact-input font-bold dark:text-slate-200">
                <option v-for="staff in staffMembers" :key="staff.id" :value="staff">{{ staff.name }}</option>
              </select>
            </div>
            <div class="md:col-span-3">
              <label class="text-[10px] font-bold opacity-60 uppercase mb-1 block">First Name</label>
              <input v-model="bookingForm.name" class="modern-input" placeholder="Name">
            </div>
            <div class="md:col-span-3">
              <label class="text-[10px] font-bold opacity-60 uppercase mb-1 block">Surname</label>
              <input v-model="bookingForm.surname" class="modern-input" placeholder="Surname">
            </div>
            <div class="md:col-span-3">
              <label class="text-[10px] font-bold opacity-60 uppercase mb-1 block">Phone</label>
              <input v-model="bookingForm.phone" class="modern-input" placeholder="5xx...">
            </div>
          </div>

          <section class="space-y-1.5">
            <div class="flex justify-between items-center px-1">
              <h3 class="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Room Stays ({{bookingForm.rooms.length}})</h3>
              <button @click="addRoom" class="text-teal-500 text-[10px] font-bold hover:underline">+ Add Another</button>
            </div>
            
            <div class="max-h-[240px] overflow-y-auto overflow-x-hidden pt-2 px-1.5 pr-2 custom-scrollbar space-y-2">
              <TransitionGroup name="list">
                <RoomStayItem 
                  v-for="(room, index) in bookingForm.rooms" 
                  :key="room.id"
                  v-model:room="bookingForm.rooms[index]"
                  :roomTypes="roomTypes"
                  :pricePolicies="pricePolicies" 
                  :canRemove="bookingForm.rooms.length > 1"
                  @remove="removeRoom(index)"
                />
              </TransitionGroup>
            </div>
          </section>

          <div class="bg-slate-50/60 dark:bg-slate-800/20 p-3 rounded-xl space-y-3 border border-slate-100 dark:border-slate-800">
            <section class="space-y-1.5">
              <div class="flex justify-between items-center px-1">
                <h3 class="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Payments Breakdown</h3>
                <button @click="addPaymentItem()" class="text-teal-500 text-[10px] font-bold hover:underline">+ Add Split</button>
              </div>
              
              <div class="max-h-[160px] overflow-y-auto overflow-x-hidden pt-2 px-1.5 pr-2 custom-scrollbar space-y-2">
                <TransitionGroup name="list">
                  <PaymentItem 
                    v-for="(pay, index) in bookingForm.payments" 
                    :key="index"
                    v-model:paymentData="bookingForm.payments[index]"
                    :balance="balance"
                    :accounts="accounts"
                    :calculateTotalFromRooms="calculateTotalFromRooms"
                    @remove="removePaymentItem(index)"
                  />
                </TransitionGroup>
              </div>
            </section>

            <div class="grid grid-cols-3 gap-4 items-center border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
              <div>
                <label class="text-[9px] uppercase font-bold opacity-50 block">Total Amount</label>
                <input type="number" v-model.number="bookingForm.total" class="financial-input text-base">
              </div>
              <div>
                <label class="text-[9px] uppercase font-bold opacity-50 block">Received</label>
                <input type="number" :value="bookingForm.received" class="financial-input text-base text-emerald-500" readonly disabled>
              </div>
              <div>
                <label class="text-[9px] uppercase font-bold opacity-50 block">Balance</label>
                <div :class="balance > 0 ? 'text-rose-500' : 'text-emerald-500'" class="text-base font-mono font-bold pt-0.5">
                  {{ formatCurrency(balance) }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-1">
            <button @click="handleSave" class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold p-2.5 rounded-lg text-xs shadow transition-all active:scale-98">
              {{ currentReservationId ? '💾 Update Changes' : '🏨 Confirm Reservation' }}
            </button>

            <div class="relative">
              <button @click="showTemplateDropdown = !showTemplateDropdown" class="btn-icon bg-emerald-500 hover:bg-emerald-600 py-2.5 px-4 rounded-lg text-xs h-full">
                📱 Message ▾
              </button>
              <div v-if="showTemplateDropdown" class="absolute bottom-full mb-2 right-0 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                <div class="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"><span class="text-[9px] font-black uppercase opacity-50">Templates</span></div>
                <div class="max-h-48 overflow-y-auto custom-scrollbar">
                  <button v-for="tpl in templates" :key="tpl.id" @click="openPreview(tpl)" class="w-full text-left p-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors border-b last:border-none border-slate-50 dark:border-slate-800">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-[11px] truncate mr-1">{{ tpl.name }}</span>
                      <span :class="tpl.category === 'GUEST' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30'" class="text-[7px] font-black border px-1 rounded uppercase flex-shrink-0">{{ tpl.category }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 flex flex-col justify-start">
        <ActivitySidebar />
      </div>

      <CustomModal :show="showPreviewModal" title="Message Preview" confirmText="Open WhatsApp" @confirm="confirmAndSend" @cancel="showPreviewModal = false">
        <template #message>
          <div class="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-emerald-500/20 shadow-inner max-h-[300px] overflow-y-auto">
            <pre class="whitespace-pre-wrap">{{ generatedText }}</pre>
          </div>
          <p class="mt-2 text-[9px] text-slate-400 italic">Review the content above before jumping to WhatsApp.</p>
        </template>
      </CustomModal>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { useTemplates } from '../composables/useTemplates'

import RoomStayItem from './RoomStayItem.vue'
import ActivitySidebar from './ActivitySidebar.vue'
import CustomModal from './CustomModal.vue'
import PaymentItem from './PaymentItem.vue'
import { useBookingLogic } from '@/composables/useBookingLogic'
import { useTemplateEditor } from '@/composables/useTemplateEditor'

const showPreviewModal = ref(false);
const showTemplateDropdown = ref(false);

const { showToast } = useToast()
const { currentReservationId, bookingForm, staffMembers, roomTypes, accounts, pricePolicies, addRoom, removeRoom, addPaymentItem, removePaymentItem, resetForm, handleSave, balance, calculateTotalFromRooms } = useBookingLogic();
const { templates, selectedTemplate } = useTemplates();
const { compileTemplate } = useTemplateEditor();

const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0)

const generatedText = ref("")
const openPreview = (tpl) => {
  try {
    const data = {
      ...bookingForm.value,
      balance: balance.value,
      rooms: bookingForm.value.rooms?.map(r => ({
        ...r,
        type: roomTypes.value.find(t => t.id === r.roomTypeId)?.name || 'NULL'
      })) || [],
      staffName: bookingForm.value.staff.name,
      payments: bookingForm.value.payments?.map(payment => {
        const account = accounts.value.find(acc => acc.id === payment.accountId);
        return { ...payment, ...account };
      }) || []
    };
    generatedText.value = compileTemplate(tpl.content, data);
    selectedTemplate.value = tpl;
    showPreviewModal.value = true;
    showTemplateDropdown.value = false;
  } catch (err) {
    console.error(err);
    showToast("Template Error", "Check Handlebars syntax", "error");
  }
};

const confirmAndSend = () => {
  const tpl = selectedTemplate.value;
  const msg = encodeURIComponent(generatedText.value);

  if (tpl.category === 'GUEST') {
    const phone = bookingForm.value.phone.replace(/\D/g, '');
    const finalPhone = phone.startsWith('5') ? `90${phone}` : phone;
    window.open(`https://wa.me/${finalPhone}?text=${msg}`, '_blank');
  } else {
    navigator.clipboard.writeText(generatedText.value);
    showToast("Copied", "Opening WhatsApp...");
    window.open(`https://web.whatsapp.com/`, '_blank');
  }
  showPreviewModal.value = false;
};

onMounted(async () => {
  if (bookingForm.value.rooms.length === 0) addRoom();
});
</script>

<style scoped>
@reference "../style.css"; 
.modern-input { @apply w-full p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-teal-500/50 transition-all text-[11px]; }
.financial-input { @apply w-full bg-transparent border-b border-slate-200 dark:border-slate-700 outline-none focus:border-teal-500 font-mono py-0.5; }
.btn-icon { @apply flex items-center gap-1.5 text-white font-bold transition-transform active:scale-98 shadow-sm; }
.compact-input { @apply w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-[11px] transition-all focus:border-teal-500/50; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-700 rounded-full; }
.list-enter-active, .list-leave-active { transition: all 0.2s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(5px); }
</style>