<template>
  <div class="p-6 max-w-[1600px] mx-auto space-y-6">
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
                      :class="[getPriceCellClass(type.id, day.date, day), 'price-cell group/cell']">

                    <div class="text-sm font-mono tracking-tighter">{{ getDisplayPrice(type.id, day.date) }}</div>
                    
                    <span v-if="hasLocalOverrideActive(type.id, day.date)" class="absolute bottom-1 right-2 text-[8px] opacity-60">⚡</span>

                    <div v-if="getActiveRule(type.id, day.date)" 
                         class="tooltip group-hover/cell:block"> 
                      {{ getActiveRule(type.id, day.date).name }} {{ hasLocalOverrideActive(type.id, day.date) ? '(Customized)' : '' }}
                    </div>

                    <div v-if="hasOverlap(type.id, day.date)" class="overlap-indicator"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

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

    <CustomModal :show="showBulkModal" :title="editingId ? 'Modify Rule' : 'Create New Pricing Rule'" @confirm="saveBatch" @cancel="showBulkModal = false">
      <template #message>
        <div class="space-y-6 text-left max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
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
          
          <div class="space-y-4">
            <label class="input-label">Room Configuration & Target Overrides</label>
            <div class="space-y-4">
              <div v-for="type in roomTypes" :key="type.id" 
                   :class="[batchForm.selectedTypes.includes(type.id) ? 'selected-row' : 'standard-row']"
                   class="p-4 rounded-[1.5rem] border transition-all space-y-3">
                
                <div class="flex items-center gap-4">
                  <input type="checkbox" v-model="batchForm.selectedTypes" :value="type.id" class="w-5 h-5 accent-teal-500 cursor-pointer">
                  <div class="flex-1">
                    <div class="text-xs font-black">{{ type.name }}</div>
                    <div class="text-[10px] opacity-40">Set global base rate & granular exceptions</div>
                  </div>
                  <div v-if="batchForm.selectedTypes.includes(type.id)" class="flex items-center gap-3 w-32 animate-in slide-in-from-right-2">
                    <input type="number" v-model.number="batchForm.prices[type.id]" class="inner-price-input" placeholder="Base Rate">
                    <span class="text-xs font-bold text-teal-500">₺</span>
                  </div>
                </div>

                <div v-if="batchForm.selectedTypes.includes(type.id)" class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Weekly Recurrence Rates</span>
                    <div class="grid grid-cols-7 gap-1">
                      <div v-for="day in weekdaysMeta" :key="day.id" class="text-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <label class="text-[9px] font-black uppercase opacity-60 block mb-1">{{ day.label }}</label>
                        <input type="number" 
                               :value="getWeekdayOverrideValue(type.id, day.id)" 
                               @input="setWeekdayOverrideValue(type.id, day.id, $event.target.value)"
                               placeholder="--" 
                               class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center text-[10px] py-0.5 font-mono font-bold text-teal-500 outline-none">
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between items-center mb-1.5">
                      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Isolated Single-Date Exceptions</span>
                      <button @click="addNewDateOverrideRow(type.id)" type="button" class="text-[9px] font-black text-teal-500 hover:underline">+ Add Isolated Target Date</button>
                    </div>
                    
                    <div v-if="!batchForm.dateOverrides[type.id] || batchForm.dateOverrides[type.id].length === 0" class="text-[10px] opacity-40 italic text-center py-2 bg-slate-50/50 dark:bg-slate-800/10 rounded-xl">
                      No standalone single-day overrides configured.
                    </div>
                    
                    <div v-else class="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                      <div v-for="(ov, idx) in batchForm.dateOverrides[type.id]" :key="idx" class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <input type="date" v-model="ov.key" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] p-1 font-mono font-bold outline-none flex-1">
                        <input type="number" v-model.number="ov.price" placeholder="Rate Override" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] p-1 font-mono font-bold text-teal-500 text-right outline-none w-24">
                        <span class="text-[10px] font-bold text-teal-500 mr-1">₺</span>
                        <button @click="removeDateOverrideRow(type.id, idx)" type="button" class="text-rose-500 text-xs px-1.5 hover:scale-110 transition-transform">✕</button>
                      </div>
                    </div>
                  </div>
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

const LegendItem = {
  props: ['color', 'label'],
  template: `
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full" :class="color"></span>
      <span class="text-[10px] font-bold uppercase tracking-wider opacity-60">{{ label }}</span>
    </div>
  `
}

const weekdaysMeta = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' }, { id: 0, label: 'Sun' }
]

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
  start: new Date(today.getFullYear(), today.getMonth(), 1), 
  end: new Date(today.getFullYear(), today.getMonth() + 1, 0) 
})

// batchForm handles prices and structured override exceptions arrays matching schema mapping keys
const batchForm = ref({ 
  name: '', startDate: '', endDate: '', selectedTypes: [], prices: {}, 
  weekdayOverrides: {}, dateOverrides: {} 
})

// --- Computed Timeline Builder ---
const timelineDays = computed(() => {
  const days = []
  let curr = new Date(timelineRange.value.start)
  const end = new Date(timelineRange.value.end)
  const todayStr = new Date().toISOString().split('T')[0]

  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      dayNum: curr.getDate(),
      monthName: curr.toLocaleDateString('tr-TR', { month: 'short' }),
      weekday: curr.toLocaleDateString('tr-TR', { weekday: 'short' }),
      weekdayNum: curr.getDay(),
      isWeekend: [0, 6].includes(curr.getDay()),
      isToday: dateStr === todayStr
    })
    curr.setDate(curr.getDate() + 1)
  }
  return days
})

watch(timelineDays, (newDays) => {
  const now = new Date().toISOString().split('T')[0];
  if (newDays.some(d => d.date === now)) {
    nextTick(() => { scrollToToday(); });
  }
}, { immediate: true });

const scrollToToday = () => {
  nextTick(() => {
    const container = document.querySelector('.custom-scrollbar');
    const todayCell = document.getElementById('scroll-target-today');
    if (container && todayCell) {
      const stickyColumnWidth = 192;
      const scrollLeft = todayCell.offsetLeft - stickyColumnWidth - 20;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  });
};

// --- Core Data Methods ---
const loadData = async () => {
  try {
    const [rulesRes, typesRes] = await Promise.all([
      bookingService.getPriceRules(), 
      bookingService.getRoomTypes()
    ])
    roomTypes.value = typesRes.data
    
    // Standardize object structures down across inbound arrays safely
    const normalRules = rulesRes.data.map(rule => ({
      ...rule,
      pricing: rule.roomTypePrices ? rule.roomTypePrices.map(rtp => ({
        roomTypeId: rtp.roomTypeId,
        price: Number(rtp.price),
        overrides: Array.isArray(rtp.overrides) ? rtp.overrides : []
      })) : []
    }))

    localRules.value = JSON.parse(JSON.stringify(normalRules))
    originalRules.value = JSON.parse(JSON.stringify(normalRules))
    isDirty.value = false
  } catch (e) { console.error('Data Load Error:', e) }
}

const getActiveRule = (roomTypeId, dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day).getTime();

  return localRules.value.find(rule => {
    const startD = new Date(rule.startDate);
    const endD = new Date(rule.endDate);
    
    const start = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate()).getTime();
    const end = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate()).getTime();

    const isWithinDate = targetDate >= start && targetDate <= end;
    const hasRoomType = rule.pricing?.some(p => p.roomTypeId === roomTypeId);
    
    return isWithinDate && hasRoomType;
  });
}

const getDisplayPrice = (roomTypeId, dateStr) => {
  const rule = getActiveRule(roomTypeId, dateStr);
  if (!rule) return '—';
  
  const pricingObj = rule.pricing.find(p => p.roomTypeId === roomTypeId);
  if (!pricingObj) return '—';

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // Resolution cascade logic matches the Prisma controller sequence
  if (pricingObj.overrides && Array.isArray(pricingObj.overrides)) {
    const dateOv = pricingObj.overrides.find(o => o.type === 'date' && o.key === dateStr);
    if (dateOv) return `${dateOv.price}₺`;

    const weekOv = pricingObj.overrides.find(o => o.type === 'weekday' && Number(o.key) === dayOfWeek);
    if (weekOv) return `${weekOv.price}₺`;
  }

  return `${pricingObj.price}₺`;
}

const hasLocalOverrideActive = (roomTypeId, dateStr) => {
  const rule = getActiveRule(roomTypeId, dateStr);
  if (!rule) return false;
  const pricingObj = rule.pricing.find(p => p.roomTypeId === roomTypeId);
  if (!pricingObj || !pricingObj.overrides) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  return pricingObj.overrides.some(o => 
    (o.type === 'date' && o.key === dateStr) || 
    (o.type === 'weekday' && Number(o.key) === dayOfWeek)
  );
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

// --- Override Forms Helper State Methods ---
const getWeekdayOverrideValue = (roomTypeId, weekdayId) => {
  const list = batchForm.value.weekdayOverrides[roomTypeId] || [];
  const found = list.find(o => Number(o.key) === weekdayId);
  return found ? found.price : '';
}

const setWeekdayOverrideValue = (roomTypeId, weekdayId, value) => {
  if (!batchForm.value.weekdayOverrides[roomTypeId]) {
    batchForm.value.weekdayOverrides[roomTypeId] = [];
  }
  const list = batchForm.value.weekdayOverrides[roomTypeId];
  const idx = list.findIndex(o => Number(o.key) === weekdayId);

  if (value === '' || value === undefined) {
    if (idx !== -1) list.splice(idx, 1);
  } else {
    if (idx !== -1) {
      list[idx].price = Number(value);
    } else {
      list.push({ type: 'weekday', key: Number(weekdayId), price: Number(value) });
    }
  }
}

const addNewDateOverrideRow = (roomTypeId) => {
  if (!batchForm.value.dateOverrides[roomTypeId]) {
    batchForm.value.dateOverrides[roomTypeId] = [];
  }
  batchForm.value.dateOverrides[roomTypeId].push({ type: 'date', key: '', price: '' });
}

const removeDateOverrideRow = (roomTypeId, index) => {
  if (batchForm.value.dateOverrides[roomTypeId]) {
    batchForm.value.dateOverrides[roomTypeId].splice(index, 1);
  }
}

// --- Interaction & Save Engine Routing ---
const openBulkModal = (rule = null) => {
  attemptedSave.value = false
  
  const initialWeekdayOverrides = {};
  const initialDateOverrides = {};
  roomTypes.value.forEach(t => {
    initialWeekdayOverrides[t.id] = [];
    initialDateOverrides[t.id] = [];
  });

  if (rule) {
    editingId.value = rule.id
    
    const initialPrices = {};
    const selectedTypesList = [];

    rule.pricing?.forEach(p => {
      const rId = p.roomTypeId;
      selectedTypesList.push(rId);
      initialPrices[rId] = p.price;
      
      if (p.overrides) {
        p.overrides.forEach(ov => {
          if (ov.type === 'weekday') initialWeekdayOverrides[rId].push({ ...ov });
          if (ov.type === 'date') initialDateOverrides[rId].push({ ...ov });
        });
      }
    });

    batchForm.value = {
      name: rule.name, startDate: rule.startDate, endDate: rule.endDate,
      selectedTypes: selectedTypesList,
      prices: initialPrices,
      weekdayOverrides: initialWeekdayOverrides,
      dateOverrides: initialDateOverrides
    }
  } else {
    editingId.value = null
    batchForm.value = { 
      name: '', startDate: '', endDate: '', selectedTypes: [], prices: {},
      weekdayOverrides: initialWeekdayOverrides, dateOverrides: initialDateOverrides
    }
  }
  showBulkModal.value = true
  nextTick(initBatchPicker)
}

const openQuickEdit = (type, day) => {
  const existing = getActiveRule(type.id, day.date);
  
  // Explicit Single Cell Override Engine Path Trigger
  if (existing) {
    openBulkModal(existing);
    // If opening an existing campaign rule from a direct grid click, pre-populate a target row instance
    const hasSingleDayOv = batchForm.value.dateOverrides[type.id]?.some(o => o.key === day.date);
    if (!hasSingleDayOv) {
      if (!batchForm.value.dateOverrides[type.id]) batchForm.value.dateOverrides[type.id] = [];
      const currentDisplayedBase = existing.pricing.find(p => p.roomTypeId === type.id)?.price || 0;
      batchForm.value.dateOverrides[type.id].push({ type: 'date', key: day.date, price: currentDisplayedBase });
    }
    return;
  }
  
  openBulkModal()
  batchForm.value.startDate = day.date
  batchForm.value.endDate = day.date
  batchForm.value.selectedTypes = [type.id]
}

const saveBatch = () => {
  attemptedSave.value = true;
  const { name, startDate, endDate, selectedTypes, prices, weekdayOverrides, dateOverrides } = batchForm.value;
  
  const validPrices = selectedTypes.length > 0 && selectedTypes.every(id => prices[id] > 0);
  if (!name || !startDate || !validPrices) return;

  const pricingStack = selectedTypes.map(tid => {
    // Collect and format our separate UI override arrays to save down as one unified array matching schema structures
    const unifiedOverrides = [
      ...(weekdayOverrides[tid] || []),
      ...(dateOverrides[tid] || []).filter(o => o.key && o.price > 0)
    ];

    return {
      roomTypeId: tid,
      price: prices[tid],
      overrides: unifiedOverrides
    };
  });

  const rule = {
    id: editingId.value || Math.random().toString(36).substr(2, 9),
    name,
    startDate,
    endDate,
    pricing: pricingStack,
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
  localRules.value.forEach((r, i) => { r.priority = i + 1; });
  isDirty.value = true;
}

const publishChanges = async () => {
  try {
    // Reconstruct matching payload to pass straight into your backend raw transactional mapping engine
    const backendPayload = localRules.value.map(rule => ({
      name: rule.name,
      startDate: rule.startDate,
      endDate: rule.endDate,
      priority: rule.priority,
      roomTypePrices: rule.pricing.map(p => ({
        roomTypeId: p.roomTypeId,
        price: p.price,
        overrides: p.overrides
      }))
    }));

    // FIX: Send backendPayload directly without nesting it again here!
    await bookingService.syncPriceRules(backendPayload);
    
    isDirty.value = false;
    await loadData();
    alert("Changes published successfully!");
  } catch (e) { 
    alert("Synchronization breakdown occurred."); 
  }
};

const undoChanges = () => {
  localRules.value = JSON.parse(JSON.stringify(originalRules.value))
  isDirty.value = false
}

// --- Pickers Init Helpers ---
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

    return targetDate >= start && targetDate <= end && r.pricing?.some(p => p.roomTypeId === tid);
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
.btn-primary { @apply px-8 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 text-white shadow-lg; }
.nav-btn { @apply p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 text-xs; }
.date-input-trigger { @apply bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold min-w-[240px] text-center outline-none; }
.card-container { @apply bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm; }
.sticky-col { @apply p-6 bg-slate-50 dark:bg-slate-800/50 rounded-l-[2rem] border-y border-l border-slate-100 dark:border-slate-700 sticky left-0 z-20 shadow-sm; }
.price-cell { @apply p-4 cursor-pointer text-center first:border-l last:rounded-r-[2rem] transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg relative; }
.tooltip { @apply absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[9px] rounded-lg shadow-2xl z-50 pointer-events-none hidden whitespace-nowrap; }
.overlap-indicator { @apply absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm; }
.rule-card { @apply bg-slate-800/50 hover:bg-slate-800 p-5 rounded-[2rem] border border-slate-700/50 cursor-pointer transition-all active:scale-95; }
.price-tag { @apply text-[10px] bg-slate-950 border border-slate-700/50 px-3 py-1 rounded-xl text-slate-400 font-bold; }
.input-label { @apply text-[10px] font-black uppercase opacity-40 ml-1; }
.inner-price-input { @apply bg-white dark:bg-slate-900 border border-teal-500/30 p-2 rounded-xl text-right font-mono font-bold text-teal-500 outline-none w-full shadow-inner; }
.selected-row { @apply border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/20; }
.standard-row { @apply border-slate-200 dark:border-slate-800; }
.modern-input { @apply w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-sm font-bold; }
.custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-800 rounded-full; }
.ghost-rule { @apply opacity-50 bg-teal-500/10 border-teal-500; }
.delete-rule-btn { @apply opacity-0 group-hover:opacity-100 hover:scale-110 text-rose-400 transition-all p-1; }
@keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.animate-pulse-slow { animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
</style>