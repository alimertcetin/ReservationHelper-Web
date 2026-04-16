<template>
  <div class="p-3 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm relative mb-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
    
    <button v-if="canRemove" @click="$emit('remove')" class="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-[8px] z-20 shadow-sm flex items-center justify-center hover:scale-110 transition-transform border-2 border-white dark:border-slate-900">✕</button>
    
    <div class="grid grid-cols-12 gap-3 mb-4">
      <div class="col-span-12 md:col-span-4 space-y-1">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Room Category</label>
        <select v-model="room.roomTypeId" class="compact-input font-bold dark:text-slate-200" @change="fetchSuggestedPrice">
          <option v-for="type in roomTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
      </div>

      <div class="col-span-8 md:col-span-5 space-y-1">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Stay Period</label>
        <div class="relative">
          <input ref="dateInput" class="compact-input cursor-pointer text-[10px] dark:text-slate-400 font-bold" placeholder="Select Dates..." readonly>
          <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[10px]">📅</span>
        </div>
      </div>

      <div class="col-span-4 md:col-span-3 space-y-1">
        <label class="text-[8px] font-black uppercase opacity-40 ml-1">Occupancy</label>
        <div class="flex gap-1 h-[34px]">
          <div v-for="type in ['adults', 'children']" :key="type" class="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-1.5 flex items-center justify-between border border-slate-100 dark:border-slate-700">
            <button @click="updateGuests(type, -1)" class="text-teal-500 hover:bg-teal-500/10 w-4 h-4 flex items-center justify-center rounded font-bold">-</button>
            <div class="text-center">
              <span class="text-[10px] font-black dark:text-slate-200">{{ room[type] }}</span>
              <p class="text-[6px] uppercase font-bold opacity-30">{{ type === 'adults' ? 'A' : 'C' }}</p>
            </div>
            <button @click="updateGuests(type, 1)" class="text-teal-500 hover:bg-teal-500/10 w-4 h-4 flex items-center justify-center rounded font-bold">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-3 mb-4 bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
      <div class="hidden md:flex col-span-6 items-center px-2">
        <p class="text-[9px] text-slate-400 italic font-medium">Click suggested price to sync automatically after adjustments.</p>
      </div>
      <div class="col-span-12 md:col-span-6 flex items-center gap-3">
        <div class="flex-1">
           <div @click="applySuggested" 
             :class="isPriceSynced ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-blue-100 bg-blue-50 dark:border-blue-500/10 dark:bg-blue-500/5'"
             class="cursor-pointer group px-3 py-1.5 rounded-lg border flex items-center justify-between transition-all active:scale-95">
            <div class="flex flex-col">
              <span class="text-[7px] font-black uppercase" :class="isPriceSynced ? 'text-emerald-500' : 'text-blue-400'">Suggested Base</span>
              <span class="text-xs font-mono font-black" :class="isPriceSynced ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'">{{ suggestedPrice }}₺</span>
            </div>
            <span v-if="!isPriceSynced" class="text-[10px] animate-pulse">👈</span>
            <span v-else class="text-[10px] text-emerald-500">✓</span>
          </div>
        </div>
        
        <div class="w-8 flex justify-center opacity-20">
          <span class="text-lg">→</span>
        </div>

        <div class="flex-1 relative">
          <label class="absolute -top-3 left-1 text-[7px] font-black uppercase text-slate-400">Final Price</label>
          <input type="number" v-model.number="room.price" 
                 :class="isPriceSynced ? 'text-emerald-600 border-emerald-500/30' : 'text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'"
                 class="compact-input !py-2 font-mono font-black text-center" placeholder="Set Price">
          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-20">₺</span>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-100 dark:border-slate-800 pt-3">
      <div class="flex items-center justify-between mb-3 px-1">
        <h4 class="text-[9px] font-black uppercase tracking-widest text-slate-400">Adjustment Policies</h4>
        <div class="flex gap-2">
          <button @click="addOverride('GUEST')" class="policy-add-btn text-teal-600 bg-teal-50 dark:bg-teal-900/20">+ Guest</button>
          <button @click="addOverride('NIGHT')" class="policy-add-btn text-amber-600 bg-amber-50 dark:bg-amber-900/20">+ Nightly</button>
          <button @click="addOverride('STAY')" class="policy-add-btn text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">+ Stay</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="policy-col">
          <span class="policy-col-label text-teal-500/50">Per Guest</span>
          <div v-for="(ov, idx) in guestOverrides" :key="'g'+idx" class="policy-pill border-teal-100 dark:border-teal-900/30 bg-teal-50/30 dark:bg-teal-900/5">
            <select v-model="ov.guestKey" class="bg-transparent text-[9px] font-bold w-10 outline-none" @change="fetchSuggestedPrice">
              <option v-for="n in (room.adults || 0)" :key="'a'+n" :value="'A'+n">A{{ n }}</option>
              <option v-for="n in (room.children || 0)" :key="'c'+n" :value="'C'+n">C{{ n }}</option>
            </select>
            <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate" @change="fetchSuggestedPrice">
              <option :value="null">Select...</option>
              <option v-for="p in getPoliciesByScope('GUEST')" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button @click="removeOverride(ov)" class="hover:text-rose-500 px-1 opacity-50 hover:opacity-100">✕</button>
          </div>
        </div>

        <div class="policy-col">
          <span class="policy-col-label text-amber-500/50">Per Night</span>
          <div v-for="(ov, idx) in nightOverrides" :key="'n'+idx" class="policy-pill border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5">
            <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate" @change="fetchSuggestedPrice">
              <option :value="null">Select...</option>
              <option v-for="p in getPoliciesByScope('NIGHT')" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button @click="removeOverride(ov)" class="hover:text-rose-500 px-1 opacity-50 hover:opacity-100">✕</button>
          </div>
        </div>

        <div class="policy-col">
          <span class="policy-col-label text-indigo-500/50">Per Stay</span>
          <div v-for="(ov, idx) in stayOverrides" :key="'s'+idx" class="policy-pill border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/5">
            <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate" @change="fetchSuggestedPrice">
              <option :value="null">Select...</option>
              <option v-for="p in getPoliciesByScope('STAY')" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button @click="removeOverride(ov)" class="hover:text-rose-500 px-1 opacity-50 hover:opacity-100">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* ... (Logic remains identical to the previous fixed version) ... */
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import 'flatpickr/dist/flatpickr.min.css'
import flatpickr from 'flatpickr'
import { Turkish } from "flatpickr/dist/l10n/tr.js"
import { bookingService } from "./../services/api.js"
import { dateToData } from "../utils/utility.js"

const props = defineProps(['room', 'roomTypes', 'pricePolicies', 'canRemove'])
const emit = defineEmits(['remove'])

const dateInput = ref(null)
let fpInstance = null
const suggestedPrice = ref(0)

const guestOverrides = computed(() => (props.room.overrides || []).filter(ov => {
  if (ov.policyId) return props.pricePolicies.find(p => p.id === ov.policyId)?.scope === 'GUEST';
  return ov._temporaryScope === 'GUEST';
}));

const nightOverrides = computed(() => (props.room.overrides || []).filter(ov => {
  if (ov.policyId) return props.pricePolicies.find(p => p.id === ov.policyId)?.scope === 'NIGHT';
  return ov._temporaryScope === 'NIGHT';
}));

const stayOverrides = computed(() => (props.room.overrides || []).filter(ov => {
  if (ov.policyId) return props.pricePolicies.find(p => p.id === ov.policyId)?.scope === 'STAY';
  return ov._temporaryScope === 'STAY';
}));

const isPriceSynced = computed(() => props.room.price > 0 && props.room.price === suggestedPrice.value);
const getPoliciesByScope = (scope) => props.pricePolicies.filter(p => p.scope === scope);

const updateGuests = (type, change) => {
  const min = type === 'adults' ? 1 : 0;
  props.room[type] = Math.max(min, (props.room[type] || 0) + change);
  validateOverrides();
  fetchSuggestedPrice();
}

const addOverride = (scope) => {
  if (!props.room.overrides) props.room.overrides = [];
  props.room.overrides.push({ 
    guestKey: scope === 'GUEST' ? 'A1' : 'ROOM', 
    policyId: null,
    _temporaryScope: scope 
  });
};

const removeOverride = (ov) => {
  const idx = props.room.overrides.indexOf(ov);
  if (idx > -1) {
    props.room.overrides.splice(idx, 1);
    fetchSuggestedPrice();
  }
}

const validateOverrides = () => {
  if (!props.room.overrides) return;
  props.room.overrides = props.room.overrides.filter(ov => {
    if (ov.guestKey === 'ROOM') return true;
    const type = ov.guestKey[0]; 
    const num = parseInt(ov.guestKey.substring(1));
    return type === 'A' ? num <= (props.room.adults || 0) : num <= (props.room.children || 0);
  });
}

const applySuggested = () => { props.room.price = suggestedPrice.value; }

const fetchSuggestedPrice = async () => {
  if (!props.room.checkIn || !props.room.checkOut || !props.room.roomTypeId) return;
  try {
    const res = await bookingService.getSuggestedPrice({
      roomTypeId: props.room.roomTypeId,
      startDate: props.room.checkIn,
      endDate: props.room.checkOut,
      adults: props.room.adults,
      children: props.room.children,
      overrides: props.room.overrides || []
    });
    suggestedPrice.value = res.data.totalSuggestedPrice;
  } catch { /* Fail silently */ }
}

const initFlatpickr = () => {
  fpInstance = flatpickr(dateInput.value, {
    mode: "range", dateFormat: "j F Y", locale: Turkish, minDate: "today",
    onChange: (dates) => {
      if (dates.length === 2) {
        props.room.checkIn = dateToData(dates[0]);
        props.room.checkOut = dateToData(dates[1]);
        fetchSuggestedPrice();
      }
    }
  });
}

onMounted(() => {
  initFlatpickr();
  if (props.room.checkIn && props.room.checkOut) fpInstance.setDate([new Date(props.room.checkIn), new Date(props.room.checkOut)], false);
  if (props.roomTypes.length > 0 && !props.room.roomTypeId) props.room.roomTypeId = props.roomTypes[0].id;
  fetchSuggestedPrice();
});

onBeforeUnmount(() => { if (fpInstance) fpInstance.destroy(); });
</script>

<style scoped>
@reference "../style.css";

.compact-input {
  @apply w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-[11px] transition-all focus:border-teal-500/50;
}

.policy-add-btn {
  @apply text-[8px] font-black px-2 py-1 rounded-md hover:scale-105 active:scale-95 transition-all;
}

.policy-col {
  @apply space-y-1.5 flex flex-col;
}

.policy-col-label {
  @apply text-[7px] font-black uppercase tracking-widest ml-1 mb-1;
}

.policy-pill {
  @apply flex items-center gap-1.5 p-1.5 rounded-lg border text-slate-600 dark:text-slate-300 transition-all;
}
</style>