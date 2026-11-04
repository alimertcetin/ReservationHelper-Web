<template>
  <div 
    @click="$emit('select', reservation)"
    class="bg-white p-4 rounded-2xl border border-slate-200 shadow-md
    hover:shadow-teal-950/50 hover:border-teal-500/60
    dark:bg-slate-800 dark:border-slate-700 dark:hover:shadow-teal-400
    cursor-pointer group transition-all"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-teal-600 dark:text-teal-400 text-sm truncate group-hover:text-teal-400 dark:group-hover:text-teal-200 transition-colors dark:group-hover:text-teal-200">
          {{ reservation.guest.firstName }} {{ reservation.guest.lastName }}
        </h4>
        <p class="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase mt-1 flex items-center gap-1 group-hover:text-slate-500 transition-colors dark:group-hover:text-slate-400">
          <!--[&_span]:opacity-50 group-hover:[&_span]:opacity-80 [&_span]:transition-opacity-->
          <span class="text-[9px] font-mono italic">#{{ reservation.id }}</span>
          <span class="text-[9px] font-mono">{{ getStaff(reservation.staffId).name }}</span>
        </p>
        
        <p class="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase mt-1 flex items-center gap-1 group-hover:text-teal-400 dark:group-hover:text-teal-200 transition-colors">
          <span v-if="reservation.rooms?.length > 1" class="bg-teal-500/10 px-1 rounded text-[9px]">
            {{ reservation.rooms.length }} STAYS
          </span>
          <span class="truncate">
            {{ reservation.rooms?.[0]?.roomType?.name || 'No Room Selected' }}
            <span v-if="reservation.rooms?.length > 1">...</span>
          </span>
        </p>
      </div>
      
      <span class="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg font-medium">
        {{ formatTime(reservation.updatedAt) }}
      </span>
      <span class="text-[9px] bg-green-100 dark:bg-green-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg font-medium">
        {{ formatTime(reservation.createdAt) }}
      </span>
    </div>
    
    <div v-if="reservation.totalAmount" class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
       <span :class="getTotalPayments(reservation.payments) < reservation.totalAmount ? 
       'text-xs font-mono font-bold text-rose-400 group-hover:text-rose-600 dark:text-rose-500 dark:group-hover:text-rose-400 transition-colors' : 
       'text-xs font-mono font-bold text-emerald-300 group-hover:text-emerald-500 dark:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors'">

         Bakiye: {{ formatCurrency(reservation.totalAmount - getTotalPayments(reservation.payments)) }}
       </span>

    </div>
  </div>
</template>

<script setup>
import { getData } from '@/composables/useBookingLogic'

const props = defineProps(['reservation'])
defineEmits(['select'])

const { staffMembers } = getData();

const formatCurrency = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val || 0)
}

const getStaff = (staffId) => {
  return staffMembers.value.find(p => p.id === staffId) || {};
}
const getTotalPayments = (payments) => {
  if (!Array.isArray(payments) || payments.length === 0) return 0;
  return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}


const formatTime = (time) => {
  if (!time) return '';
  const timestamp = typeof time === 'number' ? time : new Date(time).getTime();
  const diffMs = Date.now() - timestamp;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  return `${diffDay}d`;
}
</script>