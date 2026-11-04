// PaymentItem.vue
// FIX: PaymentItem.vue -> Açılan dropdown nesneleri için animasyonlar çalışmıyor
<template>
  <div 
    class="p-2 border rounded-xl bg-white dark:bg-slate-900 shadow-sm relative mx-1 transition-all duration-200 min-w-0"
    :class="[
      isOpen 
        ? 'border-teal-500/80 dark:border-teal-500/80 ring-2 ring-teal-500/20 shadow-md' 
        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    ]"
  >
    
    <button @click="$emit('remove')" 
            class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[7px] z-20 shadow-sm flex items-center justify-center hover:scale-110 transition-transform border border-white dark:border-slate-900">
      ✕
    </button>
    
    <div class="grid grid-cols-12 gap-2">
      
      <!-- Target Account (Custom Dropdown with Fixed Positioning) -->
      <div class="col-span-12 sm:col-span-4 space-y-0.5 min-w-0 relative">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Target Account</label>
        
        <!-- Tetikleyici Buton -->
        <div 
          ref="triggerRef"
          @click="toggleDropdown"
          class="compact-input font-bold dark:text-slate-200 truncate cursor-pointer flex items-center justify-between select-none transition-colors"
          :class="{ '!border-teal-500 !bg-teal-50/20 dark:!bg-teal-950/20': isOpen }"
        >
          <span class="truncate">
            <template v-if="selectedAccount">
              [{{ selectedAccount.type }}] {{ selectedAccount.displayName }} <span class="opacity-40 font-normal">({{ selectedAccount.owner?.name }})</span>
            </template>
            <template v-else>
              Select Account...
            </template>
          </span>
          <span class="opacity-50 text-[10px] ml-1 transition-transform duration-200" :class="{ 'rotate-180': isOpen }">▼</span>
        </div>

        <!-- Teleport ile doğrudan body'ye atılan, overflow'dan etkilenmeyen dropdown -->
        <Teleport to="body">
          <div v-if="isOpen" class="fixed inset-0 z-[99999]" @click="isOpen = false">
            <Transition name="dropdown">
              <div 
                v-if="isOpen"
                ref="dropdownPopupRef"
                class="absolute bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-2xl shadow-slate-900/20 dark:shadow-black/50 overflow-y-auto p-1.5 space-y-2 backdrop-blur-sm"
                :style="dropdownStyle"
                @click.stop
              >
                <!-- Liste içerikleri aynı kalacak -->
                <div v-for="(groupAccounts, ownerName) in groupedAccounts" :key="ownerName" class="space-y-1">
                  <div class="text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 px-2 py-1 bg-teal-50/80 dark:bg-teal-950/50 rounded sticky top-0 z-10 backdrop-blur-md">
                    {{ ownerName }}
                  </div>
                  <div 
                    v-for="account in groupAccounts" 
                    :key="account.id"
                    @click="selectAccount(account.id)"
                    class="px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all duration-150 flex items-center justify-between"
                    :class="[
                      paymentData.accountId === account.id 
                        ? 'bg-teal-500 text-white dark:bg-teal-600 shadow-sm' 
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    ]"
                  >
                    <span>[{{ account.type }}] {{ account.displayName }}</span>
                    <span v-if="paymentData.accountId === account.id" class="text-[9px]">✓</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </Teleport>

      </div>

      <!-- Payment Method -->
      <div class="col-span-12 sm:col-span-4 space-y-0.5 min-w-0">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Payment Method</label>
        <select v-model="paymentData.method" class="compact-input font-bold dark:text-slate-200">
          <option v-for="methodObj in filteredPaymentMethods" :key="methodObj" :value="methodObj">
            {{ methodObj }}
          </option>
        </select>
      </div>

      <!-- Amount -->
      <div class="col-span-12 sm:col-span-4 space-y-0.5 min-w-0 relative">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Amount</label>
        <div class="relative flex items-center min-w-0 w-full">
          <input 
            type="number" 
            v-model.number="paymentData.amount" 
            class="compact-input !py-1.5 pr-20 font-mono font-black text-emerald-500 w-full min-w-0" 
            placeholder="0.00"
          >
          
          <div class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-auto">
            <button 
              @click="fillHalf" 
              type="button"
              class="text-[8px] font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded hover:scale-105 transition-all select-none"
            >
              Half
            </button>

            <button 
              @click="fillTotal" 
              type="button"
              class="text-[8px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded hover:scale-105 transition-all select-none"
            >
              Bal
            </button>
            <span class="text-[10px] opacity-40 font-bold text-emerald-600 font-mono select-none">₺</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

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

const paymentData = defineModel('paymentData')

const isOpen = ref(false)
const triggerRef = ref(null)
const dropdownPopupRef = ref(null)
const dropdownStyle = ref({})

// Sadece menünün DIŞINDA scroll yapıldığında kapatma kontrolü
const handleScroll = (event) => {
  if (isOpen.value) {
    // Eğer scroll olayı açılan menünün içinde gerçekleştiyse kapatma
    if (dropdownPopupRef.value && dropdownPopupRef.value.contains(event.target)) {
      return
    }
    // Listenin dışındaysa kapat
    isOpen.value = false
  }
}

// Akıllı konumlandırma
const toggleDropdown = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    if (triggerRef.value) {
      const rect = triggerRef.value.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      const spaceBelow = windowHeight - rect.bottom
      const spaceAbove = rect.top
      
      const openUpward = spaceBelow < 250 && spaceAbove > spaceBelow
      const maxHeight = Math.min(260, openUpward ? spaceAbove - 10 : spaceBelow - 10)

      dropdownStyle.value = {
        width: `${rect.width}px`,
        left: `${rect.left}px`,
        maxHeight: `${maxHeight}px`,
        ...(openUpward 
          ? { bottom: `${windowHeight - rect.top + 4}px` } 
          : { top: `${rect.bottom + 4}px` }
        )
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, true)
  if (props.accounts.length > 0 && paymentData.value) {
    if (!paymentData.value.accountId) {
      paymentData.value.accountId = props.accounts[0].id;
      handleAccountChange();
      fillTotal();
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll, true)
})

const selectedAccount = computed(() => {
  return props.accounts.find(a => a.id === paymentData.value?.accountId)
})

const groupedAccounts = computed(() => {
  return props.accounts.reduce((acc, account) => {
    const ownerName = account.owner?.name || 'Other';
    if (!acc[ownerName]) {
      acc[ownerName] = [];
    }
    acc[ownerName].push(account);
    return acc;
  }, {});
});

const filteredPaymentMethods = computed(() => {
  if (!paymentData.value || !paymentData.value.accountId) return [];
  const acc = props.accounts.find(a => a.id === paymentData.value.accountId);
  return acc ? (acc.paymentMethods || []) : [];
});

const selectAccount = (accountId) => {
  paymentData.value.accountId = accountId;
  handleAccountChange();
  isOpen.value = false;
}

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
</script>

<style scoped>
@reference "../style.css";

.compact-input {
  @apply w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-[11px] transition-all focus:border-teal-500/50 min-w-0;
}

/* Dropdown için Animasyonlar */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0.95) translateY(-4px);
}
</style>