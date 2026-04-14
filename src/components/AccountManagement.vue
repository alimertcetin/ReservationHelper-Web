<template>
  <div class="p-6 max-w-[1400px] mx-auto space-y-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h1 class="text-3xl font-bold dark:text-white">Financial Entities</h1>
        <p class="text-slate-500 text-sm">Manage property owners and their payment destinations.</p>
      </div>
      <button 
        @click="openOwnerModal" 
        class="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg"
      >
        + Add New Owner
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-4 space-y-4">
        <h3 class="text-[10px] font-bold uppercase opacity-50 tracking-widest ml-2">Registered Owners</h3>
        <div v-if="owners.length === 0" class="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-slate-400 text-sm italic">
          No owners found. Add one to start.
        </div>
        
        <div v-for="owner in owners" :key="owner.id" 
             @click="selectedOwner = owner"
             :class="['p-5 rounded-[2rem] border cursor-pointer transition-all flex justify-between items-center group', 
                      selectedOwner?.id === owner.id ? 'bg-teal-500 border-teal-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white hover:border-teal-500/50']">
          <div class="flex-1">
            <p class="font-bold">{{ owner.name }}</p>
            <p class="text-[10px] opacity-60" :class="selectedOwner?.id === owner.id ? 'text-white' : ''">
              {{ owner.accounts?.length || 0 }} Accounts Linked
            </p>
          </div>
          <button @click.stop="deleteOwner(owner.id)" class="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500 hover:text-white rounded-xl transition-all text-rose-500">
            ✕
          </button>
        </div>
      </div>

      <div class="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm min-h-[500px]">
        <div v-if="selectedOwner">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h2 class="text-xl font-bold dark:text-white">{{ selectedOwner.name }}</h2>
              <p class="text-[10px] text-slate-400 uppercase font-bold">{{ selectedOwner.address || 'No Address Provided' }}</p>
            </div>
            <button @click="openAccountModal" class="bg-teal-500/10 text-teal-600 dark:text-teal-400 px-4 py-2 rounded-xl font-bold text-xs hover:bg-teal-500 hover:text-white transition-all">
              + Add Account
            </button>
          </div>

          <div v-if="selectedOwner.accounts?.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="acc in selectedOwner.accounts" :key="acc.id" 
                 class="group relative p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-3xl hover:border-teal-500/50 transition-all">
              
              <div class="flex justify-between items-start mb-2">
                <span :class="acc.type === 'CASH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'" 
                      class="text-[8px] font-bold px-2 py-1 rounded-lg uppercase">
                  {{ acc.type }}
                </span>
                <button @click="deleteAccount(acc.id)" class="opacity-0 group-hover:opacity-100 text-rose-500 text-[10px] font-bold uppercase transition-opacity">Delete</button>
              </div>

              <p class="font-bold dark:text-white text-sm">{{ acc.displayName }}</p>
              
              <div v-if="acc.iban" class="mt-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group/iban">
                <code class="text-[10px] font-mono text-slate-500 truncate mr-2">{{ acc.iban }}</code>
                <button @click="copyText(acc.iban)" class="text-[10px] text-teal-500 font-bold flex-shrink-0">Copy</button>
              </div>
            </div>
          </div>
          <div v-else class="h-64 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
            <p class="text-sm italic">No accounts linked to this owner yet.</p>
          </div>
        </div>
        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl">🏦</div>
          <p class="text-sm italic">Select an owner from the list to manage their bank details.</p>
        </div>
      </div>
    </div>

    <CustomModal :show="showOwnerModal" title="New Property Owner" @confirm="saveOwner" @cancel="showOwnerModal = false">
      <template #message>
        <div class="space-y-4 text-left">
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Full Name / Company</label>
            <input v-model="newOwner.name" class="modern-input" placeholder="e.g. Ahmet Yılmaz or Marina Group">
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Contact Address (Optional)</label>
            <textarea v-model="newOwner.address" class="modern-input h-20 resize-none" placeholder="Official billing address..."></textarea>
          </div>
        </div>
      </template>
    </CustomModal>

    <CustomModal :show="showAccModal" title="Add Payment Destination" @confirm="saveAccount" @cancel="showAccModal = false">
      <template #message>
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button @click="newAcc.type = 'BANK'" :class="newAcc.type === 'BANK' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'" class="p-2 rounded-lg text-[10px] font-bold transition-all">BANK ACCOUNT</button>
            <button @click="newAcc.type = 'CASH'" :class="newAcc.type === 'CASH' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'" class="p-2 rounded-lg text-[10px] font-bold transition-all">CASH / DESK</button>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Display Title</label>
            <input v-model="newAcc.displayName" class="modern-input" placeholder="e.g. Ziraat Main Branch">
          </div>
          <div v-if="newAcc.type === 'BANK'">
            <label class="text-[10px] font-bold uppercase opacity-50">IBAN Number</label>
            <input v-model="newAcc.iban" class="modern-input font-mono" placeholder="TR00...">
          </div>
        </div>
      </template>
    </CustomModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { bookingService } from '../services/api';
import { useToast } from '../composables/useToast';
import CustomModal from './CustomModal.vue';

const { showToast } = useToast();

const owners = ref([]);
const selectedOwner = ref(null);

const showOwnerModal = ref(false);
const showAccModal = ref(false);

const newOwner = ref({ name: '', address: '' });
const newAcc = ref({ displayName: '', type: '', iban: '' });

const fetchOwners = async () => {
  try {
    const res = await bookingService.getOwners();
    owners.value = res.data;
    // Keep selection sync if updating
    if (selectedOwner.value) {
      selectedOwner.value = owners.value.find(o => o.id === selectedOwner.value.id) || null;
    } else if (owners.value.length > 0) {
      selectedOwner.value = owners.value[0];
    }
  } catch (err) {
    showToast("Error", "Could not load data", "error");
  }
};

const openOwnerModal = () => {
  newOwner.value = { name: '', address: '' };
  showOwnerModal.value = true;
};

const saveOwner = async () => {
  if (!newOwner.value.name) return showToast("Required", "Owner name is necessary", "error");
  try {
    await bookingService.createOwner(newOwner.value);
    showToast("Success", "Owner registered successfully.");
    showOwnerModal.value = false;
    await fetchOwners();
  } catch (err) { showToast("Error", "Failed to save owner", "error"); }
};

const deleteOwner = async (id) => {
  if (!confirm("This will delete the owner and all linked accounts. Continue?")) return;
  try {
    await bookingService.deleteOwner(id); // Ensure this exists in your API
    if (selectedOwner.value?.id === id) selectedOwner.value = null;
    await fetchOwners();
  } catch (err) { showToast("Error", "Delete failed. " + err, "error"); }
};

const openAccountModal = () => {
  newAcc.value = { displayName: '', type: 'BANK', iban: '' };
  showAccModal.value = true;
};

const saveAccount = async () => {
  if (!newAcc.value.displayName) return showToast("Required", "Title is necessary", "error");
  try {
    await bookingService.createAccount({ ...newAcc.value, ownerId: selectedOwner.value.id });
    showToast("Success", "Account added.");
    showAccModal.value = false;
    await fetchOwners();
  } catch (err) {
    showToast("Error", "Failed to save account. " + err, "error");
  }
};

const deleteAccount = async (id) => {
  if (!confirm("Remove this account?")) return;
  try {
    await bookingService.deleteAccount(id);
    await fetchOwners();
  } catch (err) { showToast("Error", "Delete failed. " + JSON.stringify(err), "error"); }
};

const copyText = (text) => {
  navigator.clipboard.writeText(text);
  showToast("Copied", "IBAN copied to clipboard.");
};

onMounted(fetchOwners);
</script>

<style scoped>
  @reference "../style.css"
.modern-input {
  @apply w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-xs dark:text-white mt-1;
}
</style>