<template>
  <div 
    @click="$emit('select', reservation)"
    class="recent-card group"
  >
    <div class="flex justify-between items-start">
      <div>
        <h4 class="font-bold text-teal-600 dark:text-teal-400 text-sm transition-colors group-hover:text-teal-500">
          {{ reservation.name }} {{ reservation.surname }}
        </h4>
        <p class="text-[10px] opacity-60 font-medium uppercase mt-0.5">
          {{ reservation.room }}
        </p>
      </div>
      <span class="text-[9px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full opacity-70">
        {{ formatTime(reservation.time) }}
      </span>
    </div>
    
    <div v-if="reservation.total" class="mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
       <span class="text-[10px] opacity-50 italic">Quick View</span>
       <span class="text-[10px] font-mono font-bold text-emerald-500">
         {{ reservation.total }}₺
       </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['reservation'])
defineEmits(['select'])

const formatTime = (time) => {
  const date = typeof time === 'number' ? time : new Date(time).getTime();
  const diffMs = Date.now() - date;
  if (!time) return '';
  if (typeof time === 'string') return time;

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