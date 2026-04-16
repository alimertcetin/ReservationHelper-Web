<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="text-3xl font-black dark:text-white tracking-tighter">Price Policies</h2>
        <p class="text-slate-500 text-sm">Manage Guest, Nightly, and Stay-wide price adjustments.</p>
      </div>
      <button 
        @click="openModal" 
        class="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-3xl font-bold shadow-xl shadow-teal-500/20 transition-all active:scale-95"
      >
        + Create Policy
      </button>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-widest opacity-60">
          <tr>
            <th class="p-6">Name</th>
            <th class="p-6">Scope</th>
            <th class="p-6 text-center">Behavior</th>
            <th class="p-6 text-right">Value Impact</th>
            <th class="p-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="5" class="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Loading...</td>
          </tr>
          <tr v-else-if="policies.length === 0">
            <td colspan="5" class="p-20 text-center text-slate-400 italic">No policies found. Click create to start.</td>
          </tr>
          
          <tr v-for="policy in policies" :key="policy.id" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
            <td class="p-6">
              <div class="font-bold dark:text-slate-200">{{ policy.name }}</div>
            </td>
            <td class="p-6">
              <span 
                :class="getScopeClass(policy.scope)"
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight"
              >
                Per {{ policy.scope }}
              </span>
            </td>
            <td class="p-6 text-center">
              <span :class="policy.type === 'FIXED' ? 'text-indigo-500' : 'text-amber-600'" class="text-[10px] font-black uppercase tracking-tighter">
                {{ policy.type === 'FIXED' ? 'Fixed Replacement' : 'Adjustment' }}
              </span>
            </td>
            <td class="p-6 text-right font-mono font-bold text-lg">
              <span :class="policy.value < 0 ? 'text-rose-500' : 'text-emerald-500'">
                {{ formatValueImpact(policy) }}
              </span>
            </td>
            <td class="p-6 text-right">
              <button @click="deletePolicy(policy.id)" class="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        
        <div v-if="errorMessage" class="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2">
           <span class="text-lg">⚠️</span> {{ errorMessage }}
        </div>

        <h3 class="text-2xl font-black mb-8 dark:text-white">Configure Policy</h3>

        <div class="space-y-8">
          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Policy Name <span class="text-rose-500">*</span></label>
            <input v-model="form.name" class="modern-input" :class="{'border-rose-500 ring-rose-500/10': vErrors.name}" placeholder="e.g. Early Bird Discount">
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase text-slate-400 mb-3 ml-1 text-center font-bold">Scope</label>
            <div class="grid grid-cols-3 gap-3">
              <button v-for="s in ['GUEST', 'NIGHT', 'STAY']" :key="s" @click="form.scope = s"
                :class="form.scope === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'"
                class="py-3 rounded-2xl text-[10px] font-black transition-all">
                PER {{ s }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-3 font-bold">Math Rule</label>
              <select v-model="form.type" @change="handleTypeChange" class="modern-input">
                <option value="ADJUST">Adjustment (+/-)</option>
                <option value="FIXED">Set Price (Fixed)</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase text-slate-400 mb-3 font-bold">Unit</label>
              <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button @click="form.isPercentage = false" :class="!form.isPercentage ? 'bg-white dark:bg-slate-700 shadow-sm' : ''" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all dark:text-white">₺</button>
                
                <button 
                  @click="form.type === 'ADJUST' ? form.isPercentage = true : null" 
                  :class="[
                    form.isPercentage ? 'bg-white dark:bg-slate-700 shadow-sm' : '',
                    form.type === 'FIXED' ? 'opacity-20 cursor-not-allowed' : 'opacity-100'
                  ]" 
                  class="flex-1 py-2 rounded-lg text-xs font-bold transition-all dark:text-white"
                >
                  %
                </button>
              </div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 text-center transition-all"
               :class="{'border-rose-300 bg-rose-50/30': vErrors.value}">
            <div class="flex items-center justify-center gap-2">
              <input type="number" v-model.number="form.value" class="bg-transparent text-5xl font-black text-center outline-none w-40 dark:text-white" placeholder="0">
              <span class="text-3xl font-black text-slate-300">{{ form.isPercentage ? '%' : '₺' }}</span>
            </div>
            <p class="text-[10px] mt-4 font-bold" :class="form.value < 0 ? 'text-rose-500' : 'text-emerald-500'">
              {{ form.value < 0 ? 'DISCOUNT MODE' : 'SURCHARGE MODE' }}
            </p>
          </div>
        </div>

        <div class="mt-10 flex gap-4">
          <button @click="showModal = false" class="flex-1 py-4 font-bold text-slate-400">Cancel</button>
          <button @click="savePolicy" :disabled="isSaving" class="flex-1 py-4 bg-teal-600 disabled:opacity-50 text-white rounded-2xl font-black shadow-lg">
            {{ isSaving ? 'Saving...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { bookingService } from '@/services/api';

const policies = ref([]);
const loading = ref(false);
const isSaving = ref(false);
const showModal = ref(false);
const errorMessage = ref('');

const vErrors = reactive({ name: false, value: false });
const initialForm = { name: '', type: 'ADJUST', scope: 'GUEST', isPercentage: false, value: 0 };
const form = ref({ ...initialForm });

const formatValueImpact = (policy) => {
  const prefix = (policy.value > 0 && policy.type === 'ADJUST') ? '+' : '';
  const unit = policy.isPercentage ? '%' : '₺';
  return `${prefix}${policy.value}${unit}`;
};

const getScopeClass = (scope) => {
  switch (scope) {
    case 'STAY': return 'bg-purple-100 dark:bg-purple-500/10 text-purple-600';
    case 'NIGHT': return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
  }
};

const handleTypeChange = () => {
  if (form.value.type === 'FIXED') {
    form.value.isPercentage = false;
  }
};

const openModal = () => {
  form.value = { ...initialForm };
  errorMessage.value = '';
  vErrors.name = false;
  vErrors.value = false;
  showModal.value = true;
};

const fetchPolicies = async () => {
  loading.value = true;
  try {
    const res = await bookingService.getPolicies();
    policies.value = res.data.map(p => ({
      ...p,
      value: Number(p.value),
      isPercentage: Boolean(p.isPercentage)
    }));
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  vErrors.name = !form.value.name.trim();
  vErrors.value = form.value.value === null || form.value.value === undefined;
  if (vErrors.name) errorMessage.value = "Name is required.";
  return !vErrors.name && !vErrors.value;
};

const savePolicy = async () => {
  if (!validate()) return;
  isSaving.value = true;
  try {
    // Explicitly send all fields now that backend is updated
    await bookingService.createPolicy({
      name: form.value.name,
      type: form.value.type,
      scope: form.value.scope,
      isPercentage: form.value.isPercentage,
      value: parseFloat(form.value.value)
    });
    showModal.value = false;
    fetchPolicies();
  } catch (err) {
    errorMessage.value = err.response?.data?.error || "Error: Check name uniqueness.";
  } finally {
    isSaving.value = false;
  }
};

const deletePolicy = async (id) => {
  if (confirm("Delete this policy?")) {
    await bookingService.deletePolicy(id);
    fetchPolicies();
  }
};

onMounted(fetchPolicies);
</script>

<style scoped>
@reference "../style.css";
.modern-input {
  @apply w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-teal-500/10 font-bold transition-all;
}
</style>