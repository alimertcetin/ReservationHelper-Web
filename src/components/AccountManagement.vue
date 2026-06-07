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
             :class="[
               'group relative p-5 border rounded-3xl transition-all',
               // Active Styles
               acc.isActive !== false 
                 ? 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:border-teal-500/50' 
                 : 'bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 opacity-60 grayscale'
             ]">
          
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
                <span :class="acc.type === 'CASH' ? 'bg-amber-100 text-amber-700' : acc.type === 'BANK' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'" 
                      class="text-[8px] font-bold px-2 py-1 rounded-lg uppercase">
                  {{ acc.type }}
                </span>
                
                <span v-if="acc.isActive === false" class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                  (Inactive)
                </span>
              </div>
              
              <div class="flex gap-2">
                 <button @click="editAccount(acc)" class="opacity-0 group-hover:opacity-70 hover:opacity-100 text-teal-500 text-[10px] font-bold uppercase transition-opacity">Edit</button>
                 <button v-if="acc.isActive" @click="deleteAccount(acc.id)" class="opacity-0 group-hover:opacity-70 hover:opacity-100 text-rose-500 text-[10px] font-bold uppercase transition-opacity">Delete</button>
              </div>
            </div>

            <p class="font-bold dark:text-white text-sm">{{ acc.displayName }} <span v-if="acc.balance" class="text-emerald-500 text-[11px]">{{acc.balance}}₺</span></p>
            
            <div v-if="acc.details?.iban" class="mt-3 p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group/iban">
              <code class="text-[10px] font-mono text-slate-500 truncate mr-2">{{ acc.details.iban }}</code>
              <button @click="copyText(acc.details.iban)" class="opacity-70 hover:opacity-100 text-[10px] text-teal-500 font-bold flex-shrink-0">Copy</button>
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

    <!-- <CustomModal :show="showAccModal" :title="isEditingAccount ? 'Update Account' : 'Add Payment Destination'" @confirm="saveAccount" @cancel="showAccModal = false">
      <template #message>
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button @click="newAcc.type = 'BANK'" :class="newAcc.type === 'BANK' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'" class="p-2 rounded-lg text-[10px] font-bold transition-all">BANK ACCOUNT</button>
            <button @click="newAcc.type = 'CASH'" :class="newAcc.type === 'CASH' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'" class="p-2 rounded-lg text-[10px] font-bold transition-all">CASH / DESK</button>
            <button @click="newAcc.type = 'VIRTUAL'" :class="newAcc.type === 'VIRTUAL' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-50'" class="p-2 rounded-lg text-[10px] font-bold transition-all">VIRTUAL</button>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Display Title</label>
            <input v-model="newAcc.displayName" class="modern-input" placeholder="e.g. John Doe's Account">
          </div>
          <div v-if="newAcc.type === 'BANK'">
            <label class="text-[10px] font-bold uppercase opacity-50">Bank Name</label>
            <input v-model="newAcc.details.bankName" class="modern-input font-mono" placeholder="e.g. Pulse Financial Group">
            <label class="text-[10px] font-bold uppercase opacity-50">IBAN Number</label>
            <input v-model="newAcc.details.iban" class="modern-input font-mono" placeholder="TR00...">
          </div>
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span class="text-[10px] font-bold uppercase opacity-50">Account Status</span>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold" :class="newAcc.isActive ? 'text-teal-500' : 'text-slate-400'">
                {{ newAcc.isActive ? 'ACTIVE' : 'INACTIVE' }}
              </span>
              <input type="checkbox" v-model="newAcc.isActive" class="accent-teal-500 w-4 h-4">
            </div>
          </div>
        </div>
      </template>
    </CustomModal> -->

    <CustomModal :show="showAccModal" :title="isEditingAccount ? 'Update Account' : 'Add Payment Destination'" @confirm="saveAccount" @cancel="showAccModal = false">
  <template #message>
    <div class="space-y-5 text-left max-h-[75vh] overflow-y-auto px-1 custom-scrollbar">
      
      <div>
        <label class="text-[10px] font-bold uppercase opacity-50 block mb-1.5">Quick Presets</label>
        <div class="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button type="button" @click="applyPreset('BANK')" class="p-2 rounded-lg text-[10px] font-bold transition-all hover:bg-white/50 dark:hover:bg-slate-700/50 uppercase">🏦 Bank</button>
          <button type="button" @click="applyPreset('CASH')" class="p-2 rounded-lg text-[10px] font-bold transition-all hover:bg-white/50 dark:hover:bg-slate-700/50 uppercase">💵 Cash</button>
          <button type="button" @click="applyPreset('VIRTUAL')" class="p-2 rounded-lg text-[10px] font-bold transition-all hover:bg-white/50 dark:hover:bg-slate-700/50 uppercase">🌐 POS/Link</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-[10px] font-bold uppercase opacity-50">Account Type (Editable)</label>
          <input v-model="newAcc.type" class="modern-input font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider" placeholder="e.g. BANK, CASH, CRYPTO">
        </div>
        <div>
          <label class="text-[10px] font-bold uppercase opacity-50">Display Title</label>
          <input v-model="newAcc.displayName" class="modern-input" placeholder="e.g. Ziraat Main">
        </div>
      </div>

      <div v-if="String(newAcc.type).toUpperCase().includes('BANK')" class="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <label class="text-[10px] font-bold uppercase opacity-50">Bank Name</label>
          <input v-model="newAcc.details.bankName" class="modern-input" placeholder="Pulse Financial Group">
        </div>
        <div>
          <label class="text-[10px] font-bold uppercase opacity-50">IBAN Number</label>
          <input v-model="newAcc.details.iban" class="modern-input font-mono uppercase tracking-wider" placeholder="TR00...">
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-[10px] font-bold uppercase opacity-50 block">Supported Payment Methods (Plain Text Tags)</label>
        
        <div class="flex gap-2">
          <input 
            v-model="methodInput" 
            @keydown.enter.prevent="addCustomMethod" 
            class="modern-input !mt-0" 
            placeholder="Type a method (e.g. Visa, EFT, Crypto) and hit Enter or click +"
          >
          <button 
            type="button" 
            @click="addCustomMethod" 
            class="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 rounded-xl text-sm transition-all flex items-center justify-center"
          >
            ＋
          </button>
        </div>

        <div class="flex flex-wrap gap-1.5 p-3 min-h-[60px] bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl">
          <span v-if="newAcc.paymentMethods.length === 0" class="text-slate-400 text-[11px] italic self-center mx-auto">No methods appended yet. Type one above.</span>
          
          <div 
            v-for="(method, index) in newAcc.paymentMethods" 
            :key="index"
            class="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-2.5 pr-1.5 py-1 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <span>{{ method }}</span>
            <button 
              type="button" 
              @click="removeCustomMethod(index)" 
              class="w-4 h-4 rounded-md flex items-center justify-center bg-slate-100 hover:bg-rose-100 dark:bg-slate-700 dark:hover:bg-rose-950 text-[9px] text-slate-400 hover:text-rose-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <div>
          <p class="text-[10px] font-bold uppercase opacity-50">Account Status</p>
          <p class="text-[9px] text-slate-400">Can this be used on transactions?</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black tracking-wider" :class="newAcc.isActive ? 'text-teal-500' : 'text-slate-400'">
            {{ newAcc.isActive ? 'ACTIVE' : 'INACTIVE' }}
          </span>
          <input type="checkbox" v-model="newAcc.isActive" class="accent-teal-500 w-4 h-4 cursor-pointer">
        </div>
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
const isEditingAccount = ref(false);
const editingAccountId = ref(null);



// ********************************************
// Pre-defined application payment scopes
const methodInput = ref(''); // Bound to the custom string input box
/*const newAcc = ref({ displayName: '', details: {}, type: 'BANK' });*/

// Form initial state blueprint helper

const PRESETS = {
  BANK: { type: 'BANK', methods: ['Bank Transfer', 'Credit Card', 'EFT'] },
  CASH: { type: 'CASH', methods: ['Cash Handover', 'Foreign Currency'] },
  VIRTUAL: { type: 'VIRTUAL', methods: ['Online Payment Link', 'Mail Order'] }
};

const generateEmptyAccount = () => ({
  displayName: '',
  type: 'BANK',
  isActive: true,
  paymentMethods: [...PRESETS.BANK.methods], // Plain string arrays initialized out-of-box
  details: { bankName: '', iban: '' }
});

const newAcc = ref(generateEmptyAccount());

const openAccountModal = () => {
  isEditingAccount.value = false;
  editingAccountId.value = null;
  methodInput.value = '';
  newAcc.value = generateEmptyAccount();
  showAccModal.value = true;
};

const editAccount = (acc) => {
  isEditingAccount.value = true;
  editingAccountId.value = acc.id;
  
  // Safe extraction fallback check mapping plain array variants
  let rawMethods = [];
  if (Array.isArray(acc.paymentMethods)) {
    rawMethods = acc.paymentMethods.map(item => typeof item === 'object' ? (item.method || '') : item);
  }

  newAcc.value = {
    ...acc,
    paymentMethods: rawMethods,
    details: acc.details ? { ...acc.details } : { bankName: '', iban: '' }
  };
  methodInput.value = '';
  showAccModal.value = true;
};

const applyPreset = (presetKey) => {
  const selected = PRESETS[presetKey];
  if (!selected) return;
  
  newAcc.value.type = selected.type;
  newAcc.value.paymentMethods = [...selected.methods];
  
  if (presetKey === 'BANK') {
    newAcc.value.details = { bankName: '', iban: '' };
  } else {
    newAcc.value.details = {};
  }
};

// Plain array mutations
const addCustomMethod = () => {
  const cleanVal = methodInput.value.trim();
  if (!cleanVal) return;
  
  // Guard against identical duplicates
  if (newAcc.value.paymentMethods.some(m => m.toLowerCase() === cleanVal.toLowerCase())) {
    return showToast("Notice", "Method tag already exists.", "info");
  }
  
  newAcc.value.paymentMethods.push(cleanVal);
  methodInput.value = ''; // Flush input track field
};

const removeCustomMethod = (index) => {
  newAcc.value.paymentMethods.splice(index, 1);
};

// Handle contextual defaults whenever type tab switch triggers
const handleTypeChange = (type) => {
  newAcc.value.type = type;
  if (type !== 'BANK') {
    newAcc.value.details = {};
  } else {
    newAcc.value.details = { bankName: '', iban: '' };
  }
  
  // Auto select the primary method tag of that type category as a starter fallback
  newAcc.value.paymentMethods = [{ id: 0, method: METHOD_POOL[type][0] }];
};

const getAvailableMethodsForType = (type) => METHOD_POOL[type] || [];

const isMethodSelected = (methodString) => {
  return newAcc.value.paymentMethods.some(m => m.method === methodString);
};

const togglePaymentMethod = (methodString) => {
  const index = newAcc.value.paymentMethods.findIndex(m => m.method === methodString);
  
  if (index > -1) {
      newAcc.value.paymentMethods.splice(index, 1);
  } else {
    // Append selection to stack mapping matching index array structure
    newAcc.value.paymentMethods.push({
      id: newAcc.value.paymentMethods.length,
      method: methodString
    });
  }
};

const saveAccount = async () => {
  if (!newAcc.value.displayName) return showToast("Required", "Title is necessary", "error");
  if (!newAcc.value.type) return showToast("Required", "An account type classification is required", "error");
  if (newAcc.value.paymentMethods.length === 0) return showToast("Required", "Provide at least one method type string entry", "error");

  const payload = {
    displayName: newAcc.value.displayName,
    type: String(newAcc.value.type).toUpperCase().trim(),
    isActive: newAcc.value.isActive,
    paymentMethods: newAcc.value.paymentMethods, // Directly saves straight array string records cleanly into Json column!
    details: String(newAcc.value.type).toUpperCase().includes('BANK') ? {
      bankName: newAcc.value.details?.bankName || '',
      iban: newAcc.value.details?.iban || ''
    } : null
  };

  try {
    if (isEditingAccount.value) {
      await bookingService.updateAccount(editingAccountId.value, { ...payload, ownerId: selectedOwner.value.id });
      showToast("Updated", "Account configuration modified.");
    } else {
      await bookingService.createAccount({ ...payload, ownerId: selectedOwner.value.id });
      showToast("Success", "New destination registered.");
    }
    
    showAccModal.value = false;
    await fetchOwners();
  } catch (err) {
    showToast("Error", "Save error: " + err.message, "error");
  }
};
// ********************************************





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
    console.error(JSON.stringify(err, 0, 2));
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
/*
const openAccountModal = () => {
  isEditingAccount.value = false;
  newAcc.value = { displayName: '', type: 'BANK', details: {}, isActive: true }; // Default to true
  showAccModal.value = true;
};*/
/*
const editAccount = (acc) => {
  isEditingAccount.value = true;
  editingAccountId.value = acc.id;
  newAcc.value = {...acc};
  showAccModal.value = true;
};*/

/*const saveAccount = async () => {
  if (!newAcc.value.displayName) return showToast("Required", "Title is necessary", "error");

  const moveToDetails = (key) => {
    if (newAcc.value[key]) {
      newAcc.value.details ??= {};
      newAcc.value.details[key] = newAcc.value[key];
      newAcc.value[key] = undefined;
      console.log("Moved key: " + key);
    }
  };

  moveToDetails('iban');
  moveToDetails('bankName');
  if (Object.keys(newAcc.value.details).length == 0) {
    newAcc.value.details = undefined;
  }

  console.log(JSON.stringify({...newAcc.value}), 0, 2);

  try {
    if (isEditingAccount.value) {
      // Update Logic
      await bookingService.updateAccount(editingAccountId.value, { 
        ...newAcc.value, 
        ownerId: selectedOwner.value.id 
      });
      showToast("Updated", "Account details updated.");
    } else {
      // Create Logic
      await bookingService.createAccount({ 
        ...newAcc.value, 
        ownerId: selectedOwner.value.id 
      });
      showToast("Success", "Account added.");
    }
    
    showAccModal.value = false;
    await fetchOwners();
  } catch (err) {
    showToast("Error", "Operation failed. " + err, "error");
  }
};*/

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