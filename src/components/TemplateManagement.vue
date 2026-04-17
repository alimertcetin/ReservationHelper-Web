<template>
  <div class="p-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50 dark:bg-slate-950/50">
    <div class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-black tracking-tighter italic uppercase">
          Template <span class="text-teal-500">IDE</span>
        </h1>
        <div :class="validation.isValid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'" 
             class="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border transition-all">
          <span class="h-2 w-2 rounded-full" :class="validation.isValid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'"></span>
          {{ validation.message }}
        </div>
      </div>

      <div class="flex gap-3">
        <button @click="createNewTemplate" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all">
          + New Template
        </button>
        <button @click="saveTemplate" :disabled="!validation.isValid || !selectedTemplate" 
                class="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all">
          {{ selectedTemplate?.id ? '💾 Update Template' : '🚀 Save New' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-8">
      <div class="col-span-12 lg:col-span-3 space-y-4">
        <div class="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2">
            <button v-for="cat in ['GUEST', 'STAFF']" :key="cat" @click="filterCat = cat"
                    :class="filterCat === cat ? 'bg-white dark:bg-slate-700 shadow-sm' : 'opacity-40'"
                    class="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">{{ cat }}</button>
          </div>
          
          <div class="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
            <div v-for="t in filteredTemplates" :key="t.id" 
                 @click="selectTemplate(t)"
                 :class="selectedTemplate?.id === t.id ? 'bg-teal-500 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'"
                 class="p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group">
              <span class="font-bold text-xs truncate">{{ t.name }}</span>
              <button @click.stop="deleteTemplate(t.id)" class="opacity-0 group-hover:opacity-100 text-rose-500 hover:scale-125 transition-all p-1">✕</button>
            </div>
            <div v-if="filteredTemplates.length === 0" class="p-8 text-center text-[10px] text-slate-400 font-bold uppercase italic">No saved drafts</div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h3 class="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Available Variables</h3>
          <div class="space-y-6">
            <div v-for="group in variableGroups" :key="group.label">
              <p class="text-[9px] font-black text-teal-600 uppercase mb-2">{{ group.label }}</p>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="v in group.vars" :key="v" @click="insertVar(v)" class="ide-pill">
                  {{ v }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-6 space-y-4">
        <div v-if="selectedTemplate" class="bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <input v-model="selectedTemplate.name" class="flex-1 bg-transparent text-lg font-black outline-none border-b border-transparent focus:border-teal-500" placeholder="Unnamed Template">
              <select v-model="selectedTemplate.category" class="text-[10px] font-black bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full outline-none">
                <option value="GUEST">GUEST</option>
                <option value="STAFF">STAFF</option>
              </select>
            </div>
            <div class="flex gap-2">
              <button @click="insertSnippet('rooms')" class="snippet-btn">🔁 Room Loop</button>
              <button @click="insertSnippet('ifChild')" class="snippet-btn">👶 If Children</button>
              <button @click="insertSnippet('ifBalance')" class="snippet-btn">💰 If Debt</button>
            </div>
          </div>

          <textarea v-model="selectedTemplate.content" ref="editorRef"
                    class="w-full min-h-[500px] p-8 bg-transparent outline-none font-mono text-sm leading-relaxed text-slate-700 dark:text-slate-300 resize-none"
                    placeholder="Write your template logic here..."></textarea>
        </div>

        <div v-else class="h-full flex flex-col items-center justify-center p-20 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
          <p class="text-slate-400 font-bold uppercase text-xs">Select or Create a Template to start editing</p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-3">
        <div class="sticky top-6">
          <div class="bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[6px] border-slate-800 aspect-[9/18]">
            <div class="bg-[#E5DDD5] dark:bg-slate-950 rounded-[2.2rem] h-full p-4 flex flex-col overflow-hidden">
              <div class="h-5 w-20 bg-black/10 mx-auto rounded-full mb-6"></div>
              <div class="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                <div v-if="compiledPreview" class="bg-white dark:bg-slate-900 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm text-[11px] max-w-[90%] float-left animate-in fade-in slide-in-from-bottom-2">
                  <p class="whitespace-pre-wrap">{{ compiledPreview }}</p>
                  <span class="text-[8px] text-slate-400 block text-right mt-1">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Handlebars from 'handlebars';
import '../utils/handlebars-helpers.js';
import { bookingService } from '../services/api.js';
import { useToast } from '../composables/useToast';

const { showToast } = useToast();
const templates = ref([]);
const selectedTemplate = ref(null);
const editorRef = ref(null);
const filterCat = ref('GUEST');

// FLAT VARIABLE SCHEMA (Matching your form object)
const variableGroups = [
  { label: 'Guest Info', vars: ['name', 'surname', 'phone'] },
  { label: 'Financials', vars: ['total', 'received', 'balance'] },
  { label: 'Staff', vars: ['staffName'] },
  { label: 'Loop Items', vars: ['rooms'] }
];

// PREVIEW MOCKUP (Matching your form structure)
const dummyData = {
  name: 'Murat',
  surname: 'Aksoy',
  phone: '532 000 00 00',
  staffName: 'Ayşe Kaya',
  rooms: [
    { type: 'Deluxe Suite', checkIn: '2026-05-10', checkOut: '2026-05-12', adults: 2, children: 1, price: 4000 },
    { type: 'Eco Room', checkIn: '2026-05-12', checkOut: '2026-05-13', adults: 1, children: 0, price: 1400 }
  ],
  account:{
    name: "Sanal POS",
    owner: {
      name: "Necmi ÇALIŞKAN",
    },
    type: "BANK",
    iban: "00000",
  },
  total: 5400,
  received: 2000,
  balance: 3400,
};

// --- CRUD LOGIC ---

const fetchTemplates = async () => {
  try {
    const res = await bookingService.getTemplates();
    templates.value = res.data || [];
  } catch (err) {
    showToast("Error", "Could not fetch templates", "error");
  }
};

const selectTemplate = (t) => {
  // Deep clone so changes don't affect sidebar until saved
  selectedTemplate.value = JSON.parse(JSON.stringify(t));
};

const createNewTemplate = () => {
  selectedTemplate.value = {
    name: 'New ' + filterCat.value + ' Template',
    content: '',
    category: filterCat.value
  };
};

const saveTemplate = async () => {
  try {
    const res = await bookingService.saveTemplate(selectedTemplate.value);
    showToast("Success", "Template deployed successfully");
    await fetchTemplates();
    // Re-select from list to get IDs if it was new
    const saved = templates.value.find(t => t.name === selectedTemplate.value.name);
    if (saved) selectedTemplate.value = { ...saved };
  } catch (err) {
    showToast("Error", "Save failed", "error");
  }
};

const deleteTemplate = async (id) => {
  if (!confirm("Delete this template?")) return;
  try {
    await bookingService.deleteTemplate(id);
    if (selectedTemplate.value?.id === id) selectedTemplate.value = null;
    await fetchTemplates();
    showToast("Deleted", "Template removed.");
  } catch (err) {
    showToast("Error", "Delete failed", "error");
  }
};

// --- IDE LOGIC ---

const validation = computed(() => {
  const content = selectedTemplate.value?.content || '';
  if (!content) return { isValid: true, message: 'IDLE' };
  try {
    Handlebars.compile(content);
    const opens = (content.match(/{{#/g) || []).length;
    const closes = (content.match(/{{\//g) || []).length;
    if (opens > closes) return { isValid: false, message: 'BLOCK OPEN', errorDetail: 'A logic block is not closed.' };
    return { isValid: true, message: 'SYNTAX OK' };
  } catch (e) {
    return { isValid: false, message: 'ERROR', errorDetail: e.message };
  }
});

const compiledPreview = computed(() => {
  if (!selectedTemplate.value?.content || !validation.value.isValid) return '';
  try {
    return Handlebars.compile(selectedTemplate.value.content)(dummyData);
  } catch { return 'Compilation error...'; }
});

const filteredTemplates = computed(() => templates.value.filter(t => t.category === filterCat.value));

const insertVar = (v) => {
  const start = editorRef.value.selectionStart;
  const content = selectedTemplate.value.content;
  selectedTemplate.value.content = content.substring(0, start) + `{{${v}}}` + content.substring(editorRef.value.selectionEnd);
  editorRef.value.focus();
};

const insertSnippet = (type) => {
  const start = editorRef.value.selectionStart;
  const content = selectedTemplate.value.content;
  let s = "";
  if (type === 'rooms') s = `{{#each rooms}}\n🏨 {{type}} ({{checkIn}} - {{checkOut}}) | {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}\n{{/each}}`;
  if (type === 'ifChild') s = `{{#if children}} and {{children}} children{{/if}}`;
  if (type === 'ifBalance') s = `{{#if balance}}⚠️ Remaining: {{balance}}₺{{else}}✅ Paid in Full{{/if}}`;
  selectedTemplate.value.content = content.substring(0, start) + s + content.substring(editorRef.value.selectionEnd);
  editorRef.value.focus();
};

onMounted(fetchTemplates);
</script>

<style scoped>
@reference "../style.css";

.ide-pill {
  @apply text-[10px] font-mono font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-500 hover:text-teal-600 transition-all cursor-pointer;
}

.snippet-btn {
  @apply text-[10px] font-black bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-teal-500 transition-all;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 dark:bg-slate-700 rounded-full; }
</style>