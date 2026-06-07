<template>
  <div class="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm relative mb-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
    
    <button @click="$emit('remove')" 
            class="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-[8px] z-20 shadow-sm flex items-center justify-center hover:scale-110 transition-transform border-2 border-white dark:border-slate-900">
      ✕
    </button>
    
    <div class="grid grid-cols-12 gap-3">
      <div class="col-span-12 md:col-span-4 space-y-1">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Target Account</label>
        <select v-model="paymentData.accountId" class="compact-input font-bold dark:text-slate-200" @change="handleAccountChange">
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.owner?.name }} - {{ account.displayName }} ({{ account.type }})
          </option>
        </select>
      </div>

      <div class="col-span-12 md:col-span-4 space-y-1">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Payment Method</label>
        <select v-model="paymentData.method" class="compact-input font-bold dark:text-slate-200">
          <option v-for="methodObj in filteredPaymentMethods" :key="methodObj" :value="methodObj">
            {{ methodObj }}
          </option>
        </select>
      </div>

      <div class="col-span-12 md:col-span-4 space-y-1 relative">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Amount</label>
        <div class="relative flex items-center">
          <input 
            type="number" 
            v-model.number="paymentData.amount" 
            class="compact-input !py-2 pr-20 font-mono font-black text-emerald-500 w-full" 
            placeholder="0.00"
          >
          
          <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 context-none">

            <button 
              @click="fillHalf" 
              type="button"
              class="text-[9px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-md hover:scale-105 transition-all"
            >
              Half
            </button>

            <button 
              @click="fillTotal" 
              type="button"
              class="text-[9px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md hover:scale-105 transition-all"
            >
              Balance
            </button>
            <span class="text-[11px] opacity-40 font-bold text-emerald-600 mr-1">₺</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'

const props = defineProps({
  accounts: {
    type: Array,
    required: true
  },
  balance: {
    required: true
  },
  calculateTotalFromRooms: {
    required: true
  }
})
defineEmits(['remove'])

// paymentData = { amount, accountId, reservationId, method }
const paymentData = defineModel('paymentData')

const filteredPaymentMethods = computed(() => {
  if (!paymentData.value || !paymentData.value.accountId) return [];
  const acc = props.accounts.find(a => a.id === paymentData.value.accountId);
  return acc ? (acc.paymentMethods || []) : [];
});

const fillTotal = () => {
  const b = props.balance;
  if (paymentData.value.amount <= b) {
    paymentData.value.amount = paymentData.value.amount + b;
    return;
  }
  paymentData.value.amount = 0;
}
const fillHalf = () => {
  const b = props.balance;
  const total = props.calculateTotalFromRooms;
  const totalHalf = total * 0.5;

  if (paymentData.value.amount === total) {
    paymentData.value.amount = totalHalf
    return;
  }
  const max = Math.min(b, totalHalf);
  paymentData.value.amount = paymentData.value.amount === max ? 0 : max;
}

const handleAccountChange = () => {
  if (!paymentData.value) return;
  const acc = props.accounts.find(a => a.id === paymentData.value.accountId);
  if (acc && acc.paymentMethods && acc.paymentMethods.length > 0) {
    paymentData.value.method = acc.paymentMethods[0];
  }
};

onMounted(() => {
  if (props.accounts.length > 0 && paymentData.value) {
    // CRITICAL: Sadece accountId henüz atanmamışsa (Yeni eklenen boş split kartları için) default ata.
    // Eğer düzenleme modundaysak ve backend'den hesap gelmişse üzerine yazmayı engeller.
    if (!paymentData.value.accountId) {
      paymentData.value.accountId = props.accounts[0].id;
      handleAccountChange();
      fillTotal();
    }
  }
});
</script>

<style scoped>
@reference "../style.css";

.compact-input {
  @apply w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-[11px] transition-all focus:border-teal-500/50;
}
</style>