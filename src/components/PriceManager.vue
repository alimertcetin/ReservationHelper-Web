<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <!-- Header Section -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Inventory Pricing</h1>
        <p class="text-[12px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Global Rate & Availability Control</p>
      </div>
      
      <div class="flex items-center gap-4">
        <template v-if="isDirty">
          <button @click="undoChanges" class="text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors">
            Discard Changes
          </button>
          
          <div class="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-800 animate-pulse">
            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span class="text-xs font-black uppercase">Unpublished</span>
          </div>
        </template>
        
        <button @click="openBulkModal()" class="btn-primary bg-teal-500 hover:bg-teal-600">
          + New Price Rule
        </button>
        
        <button v-if="isDirty" @click="publishChanges" class="btn-primary bg-slate-900 dark:bg-white dark:text-slate-900">
          PUBLISH CHANGES
        </button>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-8">
      <!-- Main Timeline View -->
      <div class="col-span-12 lg:col-span-9 space-y-4">
        <div class="card-container overflow-hidden">
          <div class="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div class="flex items-center gap-1">
               <button @click="moveTimeline(-1, 'month')" class="nav-btn">← Prev Month</button>
               <div class="relative">
                 <input ref="mainRangeInput" class="date-input-trigger" placeholder="View Date Range">
               </div>
               <button @click="moveTimeline(1, 'month')" class="nav-btn">Next Month →</button>
            </div>
            <div class="flex gap-4">
               <LegendItem color="bg-rose-500" label="Conflict" />
               <LegendItem color="bg-teal-500" label="Managed" />
            </div>
          </div>

          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full border-separate border-spacing-y-2 px-4 pb-4">
              <thead>
                <tr class="text-[10px] uppercase font-black text-slate-400">
                  <th class="p-4 text-left w-48 sticky left-0 bg-white dark:bg-slate-900 z-30">Room Configuration</th>
                  <th v-for="day in timelineDays" :key="day.date" 
                    :id="day.isToday ? 'scroll-target-today' : null"
                    class="p-2 min-w-[85px] transition-all rounded-t-2xl"
                    :class="getHeaderClass(day)">
                    <div class="text-[10px] mb-1 opacity-60">{{ day.monthName }}</div>
                    <div class="text-xs font-black">{{ day.dayNum }}</div>
                    <div class="text-[9px] uppercase tracking-tighter" :class="{ 'font-black': day.isWeekend, 'opacity-60': !day.isWeekend }">
                      {{ day.weekday }}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="type in roomTypes" :key="type.id" class="group">
                  <td class="sticky-col font-black text-xs">
                    {{ type.name }}
                  </td>
                  <td v-for="day in timelineDays" :key="day.date" 
                      @click="openQuickEdit(type, day)"
                      :class="[getPriceCellClass(type.id, day.date, day), 'price-cell group/cell']"> <!-- Added group/cell here -->

                    <div class="text-sm font-mono tracking-tighter">{{ getDisplayPrice(type.id, day.date) }}</div>

                    <!-- Updated the tooltip class to use the standard Tailwind hover instead of a custom CSS selector -->
                    <div v-if="getActiveRule(type.id, day.date)" 
                         class="tooltip group-hover/cell:block"> 
                      {{ getActiveRule(type.id, day.date).name }}
                    </div>

                    <div v-if="hasOverlap(type.id, day.date)" class="overlap-indicator"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Priority Sidebar -->
      <aside class="col-span-12 lg:col-span-3">
        <div class="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl sticky top-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-black uppercase tracking-widest opacity-50">Priority Logic</h3>
            <span class="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-1 rounded-md">{{ localRules.length }} Rules</span>
          </div>
          
          <draggable v-model="localRules" item-key="id" @change="handleReorder" class="space-y-3" ghost-class="ghost-rule">
            <template #item="{ element, index }">
              <div @click="openBulkModal(element)" class="rule-card group">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-[10px] font-black text-teal-400">PRIORITY #{{ index + 1 }}</span>
                  <button @click.stop="confirmDelete(element.id)" class="delete-rule-btn">✕</button>
                </div>
                <div class="text-lg font-black leading-tight group-hover:text-teal-400 transition-colors">{{ element.name }}</div>
                <div class="text-md font-black text-slate-300 font-mono mt-1 flex items-center gap-2">
                  <span class="text-teal-500/50 text-xs">📅</span>
                  {{ formatDate(element.startDate) }} — {{ formatDate(element.endDate) }}
                </div>
                <div class="flex flex-wrap gap-1.5 mt-4">
                   <span v-for="p in element.pricing" :key="p.roomTypeId" class="price-tag">
                     {{ p.price }}₺
                   </span>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </aside>
    </div>

    <!-- Modals -->
    <CustomModal :show="showBulkModal" :title="editingId ? 'Modify Rule' : 'Create New Pricing Rule'" @confirm="saveBatch" @cancel="showBulkModal = false">
      <template #message>
        <div class="space-y-6 text-left">
          <div class="space-y-4">
             <div>
               <label class="input-label">Campaign Name *</label>
               <input v-model="batchForm.name" class="modern-input" :class="{'border-rose-500': !batchForm.name && attemptedSave}" placeholder="e.g. Weekend Special March">
             </div>
             <div class="grid grid-cols-1 gap-4">
               <label class="input-label">Date Applicability</label>
               <input ref="batchDateInput" class="modern-input" placeholder="Select start and end dates...">
             </div>
          </div>
          <div class="space-y-3">
            <label class="input-label">Room Pricing Configuration</label>
            <div class="space-y-2">
              <div v-for="type in roomTypes" :key="type.id" 
                   :class="[batchForm.selectedTypes.includes(type.id) ? 'selected-row' : 'standard-row']"
                   class="flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all">
                <input type="checkbox" v-model="batchForm.selectedTypes" :value="type.id" class="w-5 h-5 accent-teal-500 cursor-pointer">
                <div class="flex-1">
                  <div class="text-xs font-black">{{ type.name }}</div>
                  <div class="text-[10px] opacity-40">Apply custom rate</div>
                </div>
                <div v-if="batchForm.selectedTypes.includes(type.id)" class="flex items-center gap-3 w-32 animate-in slide-in-from-right-2">
                  <input type="number" v-model.number="batchForm.prices[type.id]" class="inner-price-input">
                  <span class="text-xs font-bold text-teal-500">₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CustomModal>

    <CustomModal :show="showDeleteModal" title="Delete Pricing Rule" variant="danger" @confirm="executeDelete" @cancel="showDeleteModal = false">
      <template #message>
        <p class="text-slate-600 dark:text-slate-400 text-sm">Are you sure? This immediately affects suggested prices once published.</p>
      </template>
    </CustomModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import draggable from 'vuedraggable'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { bookingService } from '../services/api'
import CustomModal from './CustomModal.vue'
import { dateToData, dataToDate } from '../utils/utility'

// A simple local component for the legend
const LegendItem = {
  props: ['color', 'label'],
  template: `
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full" :class="color"></span>
      <span class="text-[10px] font-bold uppercase tracking-wider opacity-60">{{ label }}</span>
    </div>
  `
}

// --- State ---
const roomTypes = ref([])
const localRules = ref([])
const originalRules = ref([])
const isDirty = ref(false)
const showBulkModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const ruleToDelete = ref(null)
const attemptedSave = ref(false)

const mainRangeInput = ref(null)
const batchDateInput = ref(null)

const today = new Date();
const timelineRange = ref({ 
  // Start of current month
  start: new Date(today.getFullYear(), today.getMonth(), 1), 
  // End of current month
  end: new Date(today.getFullYear(), today.getMonth() + 1, 0) 
})

const batchForm = ref({ 
  name: '', startDate: '', endDate: '', selectedTypes: [], prices: {} 
})

// --- Computed ---
const timelineDays = computed(() => {
  const days = []
  let curr = new Date(timelineRange.value.start)
  const end = new Date(timelineRange.value.end)
  const today = new Date().toISOString().split('T')[0]

  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      dayNum: curr.getDate(),
      monthName: curr.toLocaleDateString('tr-TR', { month: 'short' }),
      weekday: curr.toLocaleDateString('tr-TR', { weekday: 'short' }),
      isWeekend: [0, 6].includes(curr.getDay()),
      isToday: dateStr === today
    })
    curr.setDate(curr.getDate() + 1)
  }
  return days
})

watch(timelineDays, (newDays) => {
  const now = new Date().toISOString().split('T')[0];
  
  // Check if "Today" is present in the new date range
  if (newDays.some(d => d.date === now)) {
    // Wait for Vue to update the DOM
    nextTick(() => {
      scrollToToday();
    });
  }
}, { immediate: true }); // immediate: true covers the initial load as well

const scrollToToday = () => {
  nextTick(() => {
    const container = document.querySelector('.custom-scrollbar');
    const todayCell = document.getElementById('scroll-target-today');
    
    if (container) {
      if (todayCell) {
        const stickyColumnWidth = 192; // equivalent to w-48
        // Calculate position: target left offset - sticky column 
        // minus a little padding for better visibility
        const scrollLeft = todayCell.offsetLeft - stickyColumnWidth - 20;

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
      
    }
  });
};

// --- Methods ---
const loadData = async () => {
  try {
    const [rulesRes, typesRes] = await Promise.all([
      bookingService.getPriceRules(), 
      bookingService.getRoomTypes()
    ])
    roomTypes.value = typesRes.data
    localRules.value = rulesRes.data
    originalRules.value = rulesRes.data
    isDirty.value = false
  } catch (e) { console.error('Data Load Error:', e) }
}

const getActiveRule = (roomTypeId, dateStr) => {
  // 1. Create a date object from the calendar cell (e.g., "2026-05-01")
  // We use the components directly to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day).getTime();

  return localRules.value.find(rule => {
    // 2. Parse backend dates (ISO strings) and normalize them to local midnight
    const startD = new Date(rule.startDate);
    const endD = new Date(rule.endDate);
    
    const start = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate()).getTime();
    const end = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate()).getTime();

    // 3. Inclusive check: target must be >= start AND <= end
    const isWithinDate = targetDate >= start && targetDate <= end;
    const hasRoomType = rule.roomTypePrices?.some(rtp => rtp.roomTypeId === roomTypeId);
    
    return isWithinDate && hasRoomType;
  });
}

const getDisplayPrice = (roomTypeId, dateStr) => {
  const rule = getActiveRule(roomTypeId, dateStr);
  if (!rule) return '—';
  
  const roomPriceObj = rule.roomTypePrices.find(rtp => rtp.roomTypeId === roomTypeId);
  return roomPriceObj ? `${roomPriceObj.price}₺` : '—';
}

const getHeaderClass = (day) => {
  if (day.isToday) return 'text-teal-500 ring-2 ring-teal-500/20'
  if (day.isWeekend) return 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
  return ''
}

const getPriceCellClass = (tid, d, day) => {
  const hasPrice = getDisplayPrice(tid, d) !== '—'
  let cls = day.isWeekend ? 'bg-indigo-50/40 dark:bg-indigo-900/10 ' : 'bg-white dark:bg-slate-900 '
  
  if (!hasPrice) {
    cls += 'border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-300 italic animate-pulse-slow'
  } else {
    cls += 'text-slate-900 dark:text-teal-400 font-bold border-y border-r border-slate-100 dark:border-slate-700'
  }
  return cls
}

// --- Interaction Logic ---
const openBulkModal = (rule = null) => {
  attemptedSave.value = false
  if (rule) {
    editingId.value = rule.id
    batchForm.value = {
      name: rule.name, startDate: rule.startDate, endDate: rule.endDate,
      selectedTypes: rule.roomTypePrices.map(roomTypePrice => roomTypePrice.roomType.id),
      prices: rule.roomTypePrices.reduce((acc, p) => ({ ...acc, [p.roomType.id]: p.price }), {})
    }
  } else {
    editingId.value = null
    batchForm.value = { name: '', startDate: '', endDate: '', selectedTypes: [], prices: {} }
  }
  showBulkModal.value = true
  nextTick(initBatchPicker)
}

const openQuickEdit = (type, day) => {
  const existing = getActiveRule(type.id, day.date)
  if (existing) return openBulkModal(existing)
  
  openBulkModal()
  batchForm.value.startDate = day.date
  batchForm.value.endDate = day.date
  batchForm.value.selectedTypes = [type.id]
}

const saveBatch = () => {
  attemptedSave.value = true;
  const { name, startDate, endDate, selectedTypes, prices } = batchForm.value;
  
  const validPrices = selectedTypes.length > 0 && selectedTypes.every(id => prices[id] > 0);
  if (!name || !startDate || !validPrices) return;

  const rule = {
    id: editingId.value || Math.random().toString(36).substr(2, 9),
    name,
    startDate: startDate,
    endDate: endDate,
    roomTypePrices: selectedTypes.map(tid => ({ 
      roomTypeId: tid, 
      price: prices[tid],
      roomType: roomTypes.value.find(t => t.id === tid) // Keep object structure consistent
    })),
    priority: editingId.value 
      ? localRules.value.find(r => r.id === editingId.value).priority 
      : localRules.value.length + 1
  };

  if (editingId.value) {
    const idx = localRules.value.findIndex(r => r.id === editingId.value);
    localRules.value[idx] = rule;
  } else {
    localRules.value.unshift(rule);
  }
  
  handleReorder();
  showBulkModal.value = false;
}

const handleReorder = () => {
  localRules.value.forEach((r, i) => {
    r.priority = i + 1;
  });
  isDirty.value = true;
}

const publishChanges = async () => {
  try {
    await bookingService.syncPriceRules(localRules.value)
    isDirty.value = false
    await loadData()
    alert("Changes published!")
  } catch (e) { alert("Sync failed.") }
}

const undoChanges = () => {
  localRules.value = originalRules.value
  isDirty.value = false
}

// --- Helpers & Init ---
const initMainPicker = () => {
  flatpickr(mainRangeInput.value, {
    mode: "range", dateFormat: "Y-m-d",
    defaultDate: [timelineRange.value.start, timelineRange.value.end],
    onChange: (dates) => {
      if (dates.length === 2) {
        timelineRange.value.start = dates[0]
        timelineRange.value.end = dates[1]
      }
    }
  })
}

const initBatchPicker = () => {
  flatpickr(batchDateInput.value, {
    mode: "range", dateFormat: "Y-m-d",
    defaultDate: editingId.value ? [batchForm.value.startDate, batchForm.value.endDate] : null,
    onChange: (dates) => {
      if (dates.length === 2) {
        batchForm.value.startDate = dateToData(dates[0])
        batchForm.value.endDate = dateToData(dates[1])
      }
    }
  })
}

const moveTimeline = (val, unit) => {
  const start = new Date(timelineRange.value.start)
  const end = new Date(timelineRange.value.end)
  start.setMonth(start.getMonth() + val)
  end.setMonth(end.getMonth() + val)
  timelineRange.value = { start, end }
  initMainPicker()
}

const hasOverlap = (tid, d) => {
  const [year, month, day] = d.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day).getTime();

  return localRules.value.filter(r => {
    const startD = new Date(r.startDate);
    const endD = new Date(r.endDate);
    const start = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate()).getTime();
    const end = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate()).getTime();

    return targetDate >= start && 
           targetDate <= end && 
           r.roomTypePrices.some(p => (p.roomTypeId === tid || p.roomType?.id === tid));
  }).length > 1;
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : ''
const executeDelete = () => {
  localRules.value = localRules.value.filter(r => r.id !== ruleToDelete.value)
  isDirty.value = true
  showDeleteModal.value = false
}
const confirmDelete = (id) => { ruleToDelete.value = id; showDeleteModal.value = true }

onMounted(async () => {
  await loadData();
  initMainPicker();
  const now = new Date().toISOString().split('T')[0];
  if (timelineDays.value.some(d => d.date === now)) {
    scrollToToday();
  }
})
</script>

<style scoped>
@reference "../style.css"; 
/* Scoped component design tokens */
.btn-primary { @apply px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 text-white shadow-lg; }
.nav-btn { @apply p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 text-xs; }
.date-input-trigger { @apply bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold min-w-[240px] text-center outline-none; }
.card-container { @apply bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm; }
.sticky-col { @apply p-6 bg-slate-50 dark:bg-slate-800/50 rounded-l-[2rem] border-y border-l border-slate-100 dark:border-slate-700 sticky left-0 z-20 shadow-sm; }
.price-cell { 
  /* Removed group/cell from here */
  @apply p-4 cursor-pointer text-center first:border-l last:rounded-r-[2rem] transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg relative; 
}

.tooltip { 
  /* Removed hidden and the group-hover selector from here */
  @apply absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[9px] rounded-lg shadow-2xl z-50 pointer-events-none hidden; 
}
.overlap-indicator { @apply absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm; }
.rule-card { @apply bg-slate-800/50 hover:bg-slate-800 p-5 rounded-[2rem] border border-slate-700/50 cursor-pointer transition-all active:scale-95; }
.price-tag { @apply text-[10px] bg-slate-950 border border-slate-700/50 px-3 py-1 rounded-xl text-slate-400 font-bold; }
.input-label { @apply text-[10px] font-black uppercase opacity-40 ml-1; }
.inner-price-input { @apply bg-white dark:bg-slate-900 border border-teal-500/30 p-2 rounded-xl text-right font-mono font-bold text-teal-500 outline-none w-full shadow-inner; }
.selected-row { @apply border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20; }
.standard-row { @apply border-slate-200 dark:border-slate-800; }
.modern-input { @apply w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-sm font-bold; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-800 rounded-full; }
.ghost-rule { @apply opacity-50 bg-teal-500/10 border-teal-500; }
.delete-rule-btn { @apply opacity-0 group-hover:opacity-100 hover:scale-110 text-rose-400 transition-all p-1; }
@keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.animate-pulse-slow { animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
</style>