<template>
  <div 
    @click="$emit('select', reservation)"
    class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all cursor-pointer group"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-teal-500 transition-colors">
          {{ reservation.name }} {{ reservation.surname }}
        </h4>
        
        <p class="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase mt-1 flex items-center gap-1">
          <span v-if="reservation.rooms?.length > 1" class="bg-teal-500/10 px-1 rounded text-[9px]">
            {{ reservation.rooms.length }} STAYS
          </span>
          <span class="truncate">
            {{ reservation.rooms?.[0]?.type || 'No Room Selected' }}
            <span v-if="reservation.rooms?.length > 1">...</span>
          </span>
        </p>
      </div>
      
      <span class="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg font-medium">
        {{ formatTime(reservation.time) }}
      </span>
    </div>
    
    <div v-if="reservation.total" class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
       <span class="text-[9px] opacity-40 font-mono italic">#{{ reservation.id }}</span>
       <span class="text-xs font-mono font-bold text-emerald-500">
         {{ formatCurrency(reservation.total) }}
       </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['reservation'])
defineEmits(['select'])

const formatCurrency = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val || 0)
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