<template>
  <div class="p-2 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm relative mx-1 transition-all hover:border-slate-300 dark:hover:border-slate-700 min-w-0">
    
    <button v-if="canRemove" @click="$emit('remove')" class="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[7px] z-20 shadow-sm flex items-center justify-center hover:scale-110 transition-transform border border-white dark:border-slate-900">✕</button>
    
    <div class="grid grid-cols-12 gap-2 mb-2">
      <div class="col-span-12 sm:col-span-4 space-y-0.5 min-w-0">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Room Category</label>
        <select v-model="room.roomTypeId" class="compact-input font-bold dark:text-slate-200" @change="fetchSuggestedPrice">
          <option v-for="type in roomTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
      </div>

      <div class="col-span-7 sm:col-span-5 space-y-0.5 min-w-0">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Stay Period</label>
        <div class="relative">
          <input ref="dateInput" class="compact-input cursor-pointer text-[10px] dark:text-slate-400 font-bold pr-5" placeholder="Select Dates..." readonly>
          <span class="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[9px]">📅</span>
        </div>
      </div>

      <div class="col-span-5 sm:col-span-3 space-y-0.5 min-w-0">
        <label class="text-[8px] font-black uppercase opacity-40 ml-0.5">Occupancy</label>
        <div class="flex gap-1 h-[27px]">
          <div v-for="type in ['adults', 'children']" :key="type" class="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg px-1 flex items-center justify-between border border-slate-100 dark:border-slate-700 min-w-0">
            <button @click="updateGuests(type, -1)" class="text-teal-500 hover:bg-teal-500/10 w-3 h-3.5 flex items-center justify-center rounded font-bold text-[9px] select-none">-</button>
            <div class="text-center leading-none min-w-0 truncate mx-0.5">
              <span class="text-[10px] font-black dark:text-slate-200 block">{{ room[type] }}</span>
              <span class="text-[5px] uppercase font-bold opacity-30 block">{{ type == 'adults' ? 'Adl' : 'Chd' }}</span>
            </div>
            <button @click="updateGuests(type, 1)" class="text-teal-500 hover:bg-teal-500/10 w-3 h-3.5 flex items-center justify-center rounded font-bold text-[9px] select-none">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2 mb-2 bg-slate-50/50 dark:bg-slate-800/20 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50 min-w-0">
      <div @click="applySuggested" 
           :class="isPriceSynced ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-blue-100 bg-blue-50 dark:border-blue-500/10 dark:bg-blue-500/5'"
           class="cursor-pointer flex-1 px-2 py-1 rounded border flex items-center justify-between transition-all active:scale-95 min-w-0">
        <div class="flex flex-col leading-none truncate mr-1">
          <span class="text-[6px] font-black uppercase" :class="isPriceSynced ? 'text-emerald-500' : 'text-blue-400'">Suggested</span>
          <span class="text-[11px] font-mono font-black truncate" :class="isPriceSynced ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'">{{ suggestedPrice }}₺</span>
        </div>
        <span v-if="!isPriceSynced" class="text-[9px] animate-pulse flex-shrink-0">👈</span>
        <span v-else class="text-[9px] text-emerald-500 flex-shrink-0">✓</span>
      </div>
      
      <span class="text-slate-300 dark:text-slate-700 text-xs flex-shrink-0">→</span>

      <div class="w-24 sm:w-28 relative flex-shrink-0">
        <input type="number" v-model.number="room.price" 
               :class="isPriceSynced ? 'text-emerald-600 border-emerald-500/30 font-black' : 'text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'"
               class="compact-input !py-1 font-mono text-center pr-3" placeholder="Final Price">
        <span class="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] opacity-30 font-mono">₺</span>
      </div>
    </div>

    <div class="border-t border-slate-100 dark:border-slate-800 pt-1.5 min-w-0">
      <div class="flex items-center justify-between mb-1 px-0.5">
        <h4 class="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 truncate">
          Policies
          <button v-if="room.overrides?.length > 0" @click="room.overrides = []" class="text-[8px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-1.5 py-0.5 rounded transition-colors flex-shrink-0">
            Clear
          </button>
        </h4>
        <div class="flex gap-1 flex-shrink-0">
          <button @click="addOverride('GUEST')" class="policy-add-btn text-teal-600 bg-teal-50 dark:bg-teal-900/20">+ Guest</button>
          <button @click="addOverride('NIGHT')" class="policy-add-btn text-amber-600 bg-amber-50 dark:bg-amber-900/20">+ Night</button>
          <button @click="addOverride('STAY')" class="policy-add-btn text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20">+ Stay</button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <div class="policy-col">
          <span class="policy-col-label text-teal-500/50">Per Guest</span>
          <div class="space-y-1">
            <div v-for="(ov, idx) in guestOverrides" :key="'g'+idx" class="policy-pill border-teal-100 dark:border-teal-900/30 bg-teal-50/30 dark:bg-teal-900/5">
              <select v-model="ov.guestKey" class="bg-transparent text-[9px] font-bold w-6 outline-none flex-shrink-0" @change="fetchSuggestedPrice">
                <option v-for="n in (room.adults || 0)" :key="'a'+n" :value="'A'+n">A{{ n }}</option>
                <option v-for="n in (room.children || 0)" :key="'c'+n" :value="'C'+n">C{{ n }}</option>
              </select>
              <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate min-w-0" @change="fetchSuggestedPrice">
                <option :value="null">Select...</option>
                <option v-for="p in getPoliciesByScope('GUEST')" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <button @click="removeOverride(ov)" class="hover:text-rose-500 text-[8px] opacity-40 hover:opacity-100 ml-auto flex-shrink-0">✕</button>
            </div>
          </div>
        </div>

        <div class="policy-col">
          <span class="policy-col-label text-amber-500/50">Per Night</span>
          <div class="space-y-1">
            <div v-for="(ov, idx) in nightOverrides" :key="'n'+idx" class="policy-pill border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5">
              <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate min-w-0" @change="fetchSuggestedPrice">
                <option :value="null">Select...</option>
                <option v-for="p in getPoliciesByScope('NIGHT')" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <button @click="removeOverride(ov)" class="hover:text-rose-500 text-[8px] opacity-40 hover:opacity-100 ml-auto flex-shrink-0">✕</button>
            </div>
          </div>
        </div>

        <div class="policy-col">
          <span class="policy-col-label text-indigo-500/50">Per Stay</span>
          <div class="space-y-1">
            <div v-for="(ov, idx) in stayOverrides" :key="'s'+idx" class="policy-pill border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/5">
              <select v-model="ov.policyId" class="flex-1 bg-transparent text-[9px] outline-none truncate min-w-0" @change="fetchSuggestedPrice">
                <option :value="null">Select...</option>
                <option v-for="p in getPoliciesByScope('STAY')" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
              <button @click="removeOverride(ov)" class="hover:text-rose-500 text-[8px] opacity-40 hover:opacity-100 ml-auto flex-shrink-0">✕</button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import 'flatpickr/dist/flatpickr.min.css'
import flatpickr from 'flatpickr'
import { Turkish } from "flatpickr/dist/l10n/tr.js"
import { bookingService } from "./../services/api.js"
import { dateToData } from "../utils/utility.js"
import { useBookingLogic } from '@/composables/useBookingLogic.js'

const props = defineProps(['canRemove'])
const room = defineModel('room')
const emit = defineEmits(['remove'])

const { roomTypes, pricePolicies } = useBookingLogic();

const dateInput = ref(null)
let fpInstance = null
const suggestedPrice = ref(0)

const guestOverrides = computed(() => (room.value.overrides || []).filter(ov => {
  if (ov.policyId) return pricePolicies.value.find(p => p.id === ov.policyId)?.scope === 'GUEST';
  return ov._temporaryScope === 'GUEST';
}));

const nightOverrides = computed(() => (room.value.overrides || []).filter(ov => {
  if (ov.policyId) return pricePolicies.value.find(p => p.id === ov.policyId)?.scope === 'NIGHT';
  return ov._temporaryScope === 'NIGHT';
}));

const stayOverrides = computed(() => (room.value.overrides || []).filter(ov => {
  if (ov.policyId) return pricePolicies.value.find(p => p.id === ov.policyId)?.scope === 'STAY';
  return ov._temporaryScope === 'STAY';
}));

const isPriceSynced = computed(() => room.value.price > 0 && room.value.price === suggestedPrice.value);
const getPoliciesByScope = (scope) => pricePolicies.value.filter(p => p.scope === scope);

const updateGuests = (type, change) => {
  const min = type === 'adults' ? 1 : 0;
  room.value[type] = Math.max(min, (room.value[type] || 0) + change);
  validateOverrides();
  fetchSuggestedPrice();
}

const addOverride = (scope) => {
  if (!room.value.overrides) room.value.overrides = [];
  room.value.overrides.push({ 
    guestKey: scope === 'GUEST' ? 'A1' : 'ROOM', 
    policyId: null,
    _temporaryScope: scope 
  });
};

const removeOverride = (ov) => {
  const idx = room.value.overrides.indexOf(ov);
  if (idx > -1) {
    room.value.overrides.splice(idx, 1);
    fetchSuggestedPrice();
  }
}

const validateOverrides = () => {
  if (!room.value.overrides) return;
  room.value.overrides = room.value.overrides.filter(ov => {
    if (ov.guestKey === 'ROOM') return true;
    const type = ov.guestKey[0]; 
    const num = parseInt(ov.guestKey.substring(1));
    return type === 'A' ? num <= (room.value.adults || 0) : num <= (room.value.children || 0);
  });
}

const applySuggested = () => { room.value.price = suggestedPrice.value; }

const fetchSuggestedPrice = async () => {
  if (!room.value.checkIn || !room.value.checkOut || !room.value.roomTypeId) return;
  const r = {
      roomTypeId: room.value.roomTypeId,
      startDate: room.value.checkIn,
      endDate: room.value.checkOut,
      adults: room.value.adults,
      children: room.value.children,
      policies: room.value.overrides || []
    };
  try {
    const res = await bookingService.getSuggestedPrice(r);
    suggestedPrice.value = res.data.totalSuggestedPrice;
  } catch (error) {
    console.error(error + " " + JSON.stringify(r, 0, 2));
  }
}

const initFlatpickr = () => {
  fpInstance = flatpickr(dateInput.value, {
    mode: "range", dateFormat: "j F Y", locale: Turkish, minDate: new Date().fp_incr(-3),
    onChange: (dates) => {
      if (dates.length === 2) {
        room.value.checkIn = dateToData(dates[0]);
        room.value.checkOut = dateToData(dates[1]);
        fetchSuggestedPrice();
      }
    }
  });
}

onMounted(() => {
  initFlatpickr();
  if (room.value.checkIn && room.value.checkOut) fpInstance.setDate([new Date(room.value.checkIn), new Date(room.value.checkOut)], false);
  if (roomTypes.value.length > 0 && !room.value.roomTypeId) room.value.roomTypeId = roomTypes.value[0].id;
  fetchSuggestedPrice();
});

onBeforeUnmount(() => { if (fpInstance) fpInstance.destroy(); });
</script>

<style scoped>
@reference "../style.css";

.compact-input {
  @apply w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-[11px] transition-all focus:border-teal-500/50 min-w-0;
}

.policy-add-btn {
  @apply text-[8px] font-black px-1.5 py-0.5 rounded-md hover:scale-105 active:scale-95 transition-all;
}

.policy-col {
  @apply space-y-1 flex flex-col min-w-0 w-full;
}

.policy-col-label {
  @apply text-[7px] font-black uppercase tracking-widest ml-0.5 mb-0.5;
}

.policy-pill {
  @apply flex items-center gap-1 p-1 rounded-md border text-slate-600 dark:text-slate-300 transition-all text-[9px] min-w-0 w-full overflow-hidden;
}
</style>