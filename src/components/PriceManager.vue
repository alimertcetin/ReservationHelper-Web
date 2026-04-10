<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Inventory Pricing</h1>
        <p class="text-[12px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Global Rate & Availability Control</p>
      </div>
      
        <div class="flex items-center gap-4">
        <div v-if="isDirty" class="flex items-center gap-4 mr-2">
          <button @click="undoChanges" class="text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-colors">
            Discard Changes
          </button>
          
          <div class="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl border border-amber-100 dark:border-amber-800 animate-pulse">
            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span class="text-xs font-black uppercase">Unpublished</span>
          </div>
        </div>
        
        <button @click="openBulkModal()" class="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-95">
          + New Price Rule
        </button>
        
        <button v-if="isDirty" @click="publishChanges" class="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-10 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl">
          PUBLISH CHANGES
        </button>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 lg:col-span-9 space-y-4">
        <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div class="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
            <div class="flex items-center gap-1">
               <button @click="moveTimeline(-1, 'month')" class="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200">← Prev Month</button>
               <div class="relative">
                 <input ref="mainRangeInput" class="bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold min-w-[240px] text-center" placeholder="View Date Range">
               </div>
               <button @click="moveTimeline(1, 'month')" class="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200">Next Month →</button>
            </div>
            <div class="flex gap-4">
               <div class="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase"><span class="w-2 h-2 bg-rose-500 rounded-full"></span> Conflict</div>
               <div class="flex items-center gap-2 text-[10px] font-bold opacity-40 uppercase"><span class="w-2 h-2 bg-teal-500 rounded-full"></span> Managed</div>
            </div>
          </div>

          <div class="overflow-x-auto custom-scrollbar">

            <table class="w-full border-separate border-spacing-y-2 px-4 pb-4">
            <thead>
              <tr class="text-[10px] uppercase font-black text-slate-400">
                <th class="p-4 text-left w-48 sticky left-0 bg-white dark:bg-slate-900 z-30">Room Configuration</th>
                
                <th v-for="day in timelineDays" :key="day.date" 
                    class="p-2 min-w-[85px] transition-all rounded-t-2xl"
                    :class="[
                      day.isToday ? 'text-teal-500 ring-2 ring-teal-500/20' : '',
                      day.isWeekend ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''
                    ]">
                  <div class="text-[10px] mb-1 opacity-60">{{ day.monthName }}</div>
                  <div class="text-xs font-black">{{ day.dayNum }}</div>
                  <div class="text-[9px] uppercase tracking-tighter" :class="day.isWeekend ? 'font-black' : 'opacity-60'">{{ day.weekday }}</div>
                </th>
              </tr>
            </thead>
            
            <tbody>
              <tr v-for="type in roomTypes" :key="type.id" class="group">
                <td class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-l-[2rem] border-y border-l border-slate-100 dark:border-slate-700 font-black text-xs sticky left-0 z-20 shadow-sm">
                  {{ type.name }}
                </td>
                
                <td v-for="day in timelineDays" :key="day.date" 
                    @click="openQuickEdit(type, day)"
                    :class="[
                      getPriceCellClass(type.id, day.date, day), 
                      'p-4 cursor-pointer text-center first:border-l last:rounded-r-[2rem]'
                    ]">
                  <div class="text-sm font-mono tracking-tighter">{{ getDisplayPrice(type.id, day.date) }}</div>
                  
                  <div v-if="getActiveRuleName(type.id, day.date)" class="hidden group-hover/cell:block absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[9px] rounded-lg shadow-2xl z-50 pointer-events-none">
                    {{ getActiveRuleName(type.id, day.date) }}
                  </div>
                  
                  <div v-if="hasOverlap(type.id, day.date)" class="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
                </td>
              </tr>
            </tbody>
          </table>
            

          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-3">
        <div class="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[3rem] shadow-2xl sticky top-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xs font-black uppercase tracking-widest opacity-50">Priority Logic</h3>
            <span class="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-1 rounded-md">{{ localRules.length }} Rules</span>
          </div>
          
          <draggable v-model="localRules" item-key="id" @change="handleReorder" class="space-y-3" ghost-class="ghost-rule">


            <template #item="{ element, index }">
            <div @click="openBulkModal(element)" class="bg-slate-800/50 hover:bg-slate-800 p-5 rounded-[2rem] border border-slate-700/50 cursor-pointer transition-all group active:scale-95">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black text-teal-400">PRIORITY #{{ localRules.length - index }}</span>
                <button @click.stop="confirmDelete(element.id)" class="opacity-0 group-hover:opacity-100 hover:scale-110 text-rose-400 transition-all p-1">✕</button>
              </div>
              
              <div class="text-lg font-black leading-tight group-hover:text-teal-400 transition-colors">
                {{ element.name }}
              </div>
              
              <div class="text-md font-black text-slate-300 font-mono mt-1 flex items-center gap-2">
                <span class="text-teal-500/50 text-xs">📅</span>
                {{ formatDate(element.startDate) }} — {{ formatDate(element.endDate) }}
              </div>

              <div class="flex flex-wrap gap-1.5 mt-4">
                 <span v-for="p in element.pricing" :key="p.roomTypeId" class="text-[10px] bg-slate-950 border border-slate-700/50 px-3 py-1 rounded-xl text-slate-400 font-bold">
                   {{ p.price }}₺
                 </span>
              </div>
            </div>
          </template>


          </draggable>
        </div>
      </div>
    </div>

    <CustomModal :show="showBulkModal" :title="editingId ? 'Modify Rule' : 'Create New Pricing Rule'" @confirm="saveBatch" @cancel="showBulkModal = false">
      <template #message>
        <div class="space-y-6 text-left">
          <div class="space-y-4">
             <div>
               <label class="text-[10px] font-black uppercase opacity-40 ml-1">Campaign Name *</label>
               <input v-model="batchForm.name" class="modern-input" :class="{'border-rose-500': !batchForm.name && attemptedSave}" placeholder="e.g. Weekend Special March">
             </div>
             <div class="grid grid-cols-1 gap-4">
               <label class="text-[10px] font-black uppercase opacity-40 ml-1">Date Applicability</label>
               <input ref="batchDateInput" class="modern-input" placeholder="Select start and end dates...">
             </div>
          </div>
          
          <div class="space-y-3">
            <label class="text-[10px] font-black uppercase opacity-40 ml-1">Room Pricing Configuration</label>
            <div class="space-y-2">
              <div v-for="type in roomTypes" :key="type.id" 
                   :class="[batchForm.selectedTypes.includes(type.id) ? 'border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20' : 'border-slate-200 dark:border-slate-800']"
                   class="flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all">
                <input type="checkbox" v-model="batchForm.selectedTypes" :value="type.id" class="w-5 h-5 accent-teal-500 cursor-pointer">
                <div class="flex-1">
                  <div class="text-xs font-black">{{ type.name }}</div>
                  <div class="text-[10px] opacity-40">Apply custom rate for this room</div>
                </div>
                <div v-if="batchForm.selectedTypes.includes(type.id)" class="flex items-center gap-3 w-32 animate-in slide-in-from-right-2">
                  <input type="number" v-model.number="batchForm.prices[type.id]" class="bg-white dark:bg-slate-900 border border-teal-500/30 p-2 rounded-xl text-right font-mono font-bold text-teal-500 outline-none w-full shadow-inner">
                  <span class="text-xs font-bold text-teal-500">₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </CustomModal>

    <CustomModal 
    :show="showDeleteModal" 
    title="Delete Pricing Rule" 
    variant="danger"
    @confirm="executeDelete" 
    @cancel="showDeleteModal = false"
    >
    <template #message>
      <p class="text-slate-600 dark:text-slate-400 text-sm">
        Are you sure you want to remove this pricing rule? This will affect the suggested prices for these dates immediately after publishing.
      </p>
    </template>
  </CustomModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { bookingService } from '../services/api'
import CustomModal from './CustomModal.vue'
import { dateToData } from '../utils/utility'

const roomTypes = ref([])
const localRules = ref([])
const isDirty = ref(false)
const showBulkModal = ref(false)
const editingId = ref(null)
const attemptedSave = ref(false)
const mainRangeInput = ref(null)
const batchDateInput = ref(null)

const originalRules = ref([])
const showDeleteModal = ref(false)
const ruleToDelete = ref(null)

const timelineRange = ref({ start: new Date(), end: new Date(new Date().setDate(new Date().getDate() + 30)) })
const batchForm = ref({ name: '', startDate: '', endDate: '', selectedTypes: [], prices: {} })

const timelineStartLabel = computed(() => timelineRange.value.start.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }))

const timelineDays = computed(() => {
  const days = []
  let curr = new Date(timelineRange.value.start)
  const end = new Date(timelineRange.value.end)
  const today = new Date().toISOString().split('T')[0]

  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0]
    days.push({
      date: dateStr, dayNum: curr.getDate(), monthName: curr.toLocaleDateString('tr-TR', { month: 'short' }),
      weekday: curr.toLocaleDateString('tr-TR', { weekday: 'short' }),
      isWeekend: [0, 6].includes(curr.getDay()), isToday: dateStr === today
    })
    curr.setDate(curr.getDate() + 1)
  }
  return days
})

const loadData = async () => {
  try {
    const [rulesRes, typesRes] = await Promise.all([bookingService.getPriceRules(), bookingService.getRoomTypes()])
    roomTypes.value = typesRes.data
    const processed = processRulesFromServer(rulesRes.data)
    localRules.value = processed
    originalRules.value = JSON.parse(JSON.stringify(processed)) // Deep copy for undo
    isDirty.value = false
  } catch (e) { console.error(e) }
}

const undoChanges = () => {
  localRules.value = JSON.parse(JSON.stringify(originalRules.value))
  isDirty.value = false
}

// Deletion Confirmation Logic
const confirmDelete = (id) => {
  ruleToDelete.value = id
  showDeleteModal.value = true
}

const executeDelete = () => {
  if (ruleToDelete.value) {
    removeRule(ruleToDelete.value)
    showDeleteModal.value = false
    ruleToDelete.value = null
  }
}

const processRulesFromServer = (flat) => {
  const grouped = flat.reduce((acc, rule) => {
    const key = `${rule.name}-${rule.startDate}-${rule.endDate}-${rule.priority}`
    if (!acc[key]) acc[key] = { ...rule, id: Math.random().toString(36).substr(2, 9), pricing: [] }
    acc[key].pricing.push({ roomTypeId: rule.roomTypeId, price: rule.price })
    return acc
  }, {})
  return Object.values(grouped).sort((a, b) => b.priority - a.priority)
}

const openBulkModal = (rule = null) => {
  attemptedSave.value = false
  if (rule) {
    editingId.value = rule.id
    batchForm.value = {
      name: rule.name, startDate: rule.startDate, endDate: rule.endDate,
      selectedTypes: rule.pricing.map(p => p.roomTypeId),
      prices: rule.pricing.reduce((acc, p) => ({ ...acc, [p.roomTypeId]: p.price }), {})
    }
  } else {
    editingId.value = null
    batchForm.value = { name: '', startDate: '', endDate: '', selectedTypes: [], prices: {} }
  }
  showBulkModal.value = true
  nextTick(initBatchPicker)
}

const openQuickEdit = (type, day) => {
  const existing = localRules.value.find(r => 
    new Date(r.startDate) <= new Date(day.date) && new Date(r.endDate) >= new Date(day.date) && 
    r.pricing.some(p => p.roomTypeId === type.id)
  )
  if (existing) openBulkModal(existing)
  else {
    openBulkModal()
    batchForm.value.startDate = day.date
    batchForm.value.endDate = day.date
    batchForm.value.selectedTypes = [type.id]
  }
}

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

const saveBatch = () => {
  attemptedSave.value = true
  const validPrices = batchForm.value.selectedTypes.every(id => batchForm.value.prices[id] > 0)
  
  if (!batchForm.value.name || !batchForm.value.startDate || !batchForm.value.selectedTypes.length || !validPrices) {
    return alert("Please ensure rule name, dates, and prices for selected rooms are valid.")
  }
  
  const rule = {
    id: editingId.value || null,
    name: batchForm.value.name,
    startDate: batchForm.value.startDate,
    endDate: batchForm.value.endDate,
    pricing: batchForm.value.selectedTypes.map(tid => ({ roomTypeId: tid, price: batchForm.value.prices[tid] })),
    priority: editingId.value ? localRules.value.find(r => r.id === editingId.value).priority : localRules.value.length + 1
  }

  if (editingId.value) {
    const idx = localRules.value.findIndex(r => r.id === editingId.value)
    localRules.value[idx] = rule
  } else {
    localRules.value.unshift(rule)
  }
  handleReorder()
  showBulkModal.value = false
}

const moveTimeline = (val, unit) => {
  const start = new Date(timelineRange.value.start)
  const end = new Date(timelineRange.value.end)
  if (unit === 'month') {
    start.setMonth(start.getMonth() + val)
    end.setMonth(end.getMonth() + val)
    start.setDate(1)
    end.setDate(1)
  }
  timelineRange.value = { start, end }
  initMainPicker()
}

const getDisplayPrice = (tid, d) => {
  const date = new Date(d)
  const rule = localRules.value.find(r => new Date(r.startDate) <= date && new Date(r.endDate) >= date && r.pricing.some(p => p.roomTypeId === tid))
  return rule ? rule.pricing.find(p => p.roomTypeId === tid).price + '₺' : '—'
}

const getActiveRuleName = (tid, d) => {
  const date = new Date(d)
  return localRules.value.find(r => new Date(r.startDate) <= date && new Date(r.endDate) >= date && r.pricing.some(p => p.roomTypeId === tid))?.name
}

const handleReorder = () => { localRules.value.forEach((r, i) => r.priority = localRules.value.length - i); isDirty.value = true }
const removeRule = (id) => { localRules.value = localRules.value.filter(r => r.id !== id); isDirty.value = true }

const getPriceCellClass = (tid, d, day) => {
  const hasPrice = getDisplayPrice(tid, d) !== '—';
  let classes = 'transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg relative group/cell ';
  
  let flag = false;
  // Background logic
  if (day.isWeekend) {
    classes += 'bg-indigo-50/40 dark:bg-indigo-900/10 '; // Weekend tint
    if (hasPrice) {
      /*

                      day.isToday ? 'text-teal-500 ring-2 ring-teal-500/20' : '',
                      day.isWeekend ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''
      */
      classes += 'text-indigo-500 dark:text-indigo-300 font-bold border-y border-r border-slate-100 dark:border-slate-700'
      flag = true;
    }
  } else {
    classes += 'bg-white dark:bg-slate-900 ';
  }

  // Price existence logic (The UI Tip)
  if (!hasPrice) {
    // Add a dashed border and subtle pulse to "gaps"
    classes += 'border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-300 italic animate-pulse-slow ';
  } else {
    if(flag === false){
    classes += 'text-slate-900 dark:text-teal-400 font-bold border-y border-r border-slate-100 dark:border-slate-700 '; 
    }
  }

  return classes;
}

const hasOverlap = (tid, d) => {
  const date = new Date(d)
  return localRules.value.filter(r => new Date(r.startDate) <= date && new Date(r.endDate) >= date && r.pricing.some(p => p.roomTypeId === tid)).length > 1
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : ''

const publishChanges = async () => {
  try {
    // We send localRules as they are (nested). 
    // The backend handles the mapping into the flat database table.
    await bookingService.syncPriceRules(localRules.value);
    
    isDirty.value = false;
    await loadData(); // Reload to get fresh data from DB
    alert("Changes published successfully!");
  } catch (e) {
    console.error(e);
    alert("Sync failed. Check console for details.");
  }
}


onMounted(() => { loadData(); initMainPicker() })
</script>

<style scoped>
@reference "../style.css";
.modern-input { @apply w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-sm font-bold; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-800 rounded-full; }
.ghost-rule { @apply opacity-50 bg-teal-500/10 border-teal-500; }
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Make weekends feel like a connected column */
th.bg-indigo-50\/50 + th.bg-indigo-50\/50,
td.bg-indigo-50\/40 + td.bg-indigo-50\/40 {
  border-left: 1px solid rgba(99, 102, 241, 0.1);
}
</style>