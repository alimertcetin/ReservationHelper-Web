<template>
  <div class="w-full lg:w-[360px] shrink-0 flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl lg:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl h-fit min-h-[700px] max-h-[70vh] lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4 transition-all">
    
    <div class="px-1 space-y-2 shrink-0">
      <h3 class="font-bold text-base lg:text-lg text-slate-800 dark:text-slate-100 flex items-center justify-between">
        <span>Recent Activity</span>
      </h3>
      
      <div class="relative w-full flex items-center">
        <input 
          v-model="searchQuery" 
          placeholder="Search guest or phone..." 
          class="modern-input pr-10 !rounded-xl text-xs"
        >
      
        <button v-if="searchQuery" @click="searchQuery = '' " class="absolute right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-[8px] z-20 shadow-sm flex items-center justify-center hover:scale-110 transition-transform border-2 border-white dark:border-slate-900">✕</button>

        <div v-if="isFetching || isFetchingTimeoutStarted" class="absolute right-8 pointer-events-none">
          <svg class="animate-spin h-4 w-4 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>

    <div class="space-y-2 overflow-y-auto px-1 custom-scrollbar flex-1 minimal-gap min-h-[150px]">
      <ActivityCard 
        v-for="res in reservationsToDisplay" 
        :key="res.id" 
        :reservation="res" 
        @select="selectReservationCard(res)" 
      />
      
      <div v-if="reservationsToDisplay.length === 0 && !isFetching && !isFetchingTimeoutStarted" class="text-center py-8 text-xs text-slate-400">
        No matching reservations found.
      </div>
    </div>

    <div class="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 px-1 shrink-0 mt-auto">
      <div class="flex items-center justify-between">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all select-none"
        >
          ◀ Prev
        </button>

        <span class="text-[10px] font-mono font-bold text-slate-400">
          PAGE {{ currentPage }} / {{ totalPages }}
        </span>

        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-all select-none"
        >
          Next ▶
        </button>
      </div>

      <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-center gap-1 mt-1">
        <button
          v-for="pageNum in totalPages"
          :key="pageNum"
          @click="goToPage(pageNum)"
          :class="[
            'w-6 h-6 text-[10px] font-mono font-bold rounded-md transition-all flex items-center justify-center border',
            currentPage === pageNum
              ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700'
          ]"
        >
          {{ pageNum }}
        </button>
      </div>
    </div>

    <CustomModal 
      :show="fillFormModalActive" 
      title="Load Reservation?" 
      confirmText="Fill Form" 
      @confirm="confirmLoadAction" 
      @cancel="fillFormModalActive = false"
    >
      <template #message>
        Would you like to auto-fill the form with <strong>{{ selectedResData?.guest?.firstName }} {{ selectedResData?.guest?.lastName }}</strong>'s information?
      </template>
    </CustomModal>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useBookingActivity } from '../composables/useBookingActivity';
import ActivityCard from './ActivityCard.vue';
import CustomModal from './CustomModal.vue';

const {
  searchQuery, currentPage, totalPages, reservationsToDisplay, isFetching, isFetchingTimeoutStarted,
  fillFormModalActive, selectedResData,
  nextPage, prevPage, goToPage, fetchRecent, selectReservationCard, confirmLoadAction
} = useBookingActivity();

onMounted(() => {
  fetchRecent();
});
</script>

<style scoped>
@reference "../style.css";
.modern-input { @apply w-full p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-400/20 transition-all text-xs text-slate-700 dark:text-slate-200; }
.minimal-gap { gap: 0.5rem !important; }
</style>