// src/composables/useTemplates.js
import { ref, computed } from 'vue';
import Handlebars from 'handlebars';
import '../utils/handlebars-helpers.js';
import { bookingService } from '../services/api.js';
import { useToast } from './useToast';

// Shared global singleton states so both views stay automatically in-sync
const templates = ref([]);
const selectedTemplate = ref(null);
const filterCat = ref('GUEST');

// Static Data Schemas for the IDE
export const variableGroups = [
  { label: 'Guest Info', vars: ['name', 'surname', 'phone'] },
  { label: 'Financials', vars: ['total', 'received', 'balance', 'account.displayName', 'account.type', 'account.iban'] },
  { label: 'Staff', vars: ['staffName'] },
  { label: 'Loop Items', vars: ['rooms'] }
];

// Structural Dummy Defaults used for empty-form preview fail-safes
export const dummyFallbackData = {
  name: "Joe",
  surname: "BLOGGS",
  phone: "555 123 45 67",
  staffName: "System Operator",
  rooms: [
    { type: "Deluxe Suite", checkIn: "2026-06-15", checkOut: "2026-06-20", adults: 2, children: 1, price: 5000 },
    { type: "Standard Double", checkIn: "2026-06-15", checkOut: "2026-06-17", adults: 1, children: 0, price: 2200 }
  ],
  total: 12200,
  received: 4000,
  balance: 8200,
  account: { displayName: "Main Operations Account", type: "BANK", iban: "TR00112233" }
};

export function useTemplates() {
  const { showToast } = useToast();

  const fetchTemplates = async () => {
    try {
      const res = await bookingService.getTemplates();
      templates.value = res.data || [];
    } catch (err) {
      showToast("Error", "Could not fetch templates", "error");
    }
  };

  const selectTemplate = (t) => {
    selectedTemplate.value = JSON.parse(JSON.stringify(t));
  };

  const createNewTemplate = () => {
    selectedTemplate.value = {
      name: `New ${filterCat.value} Template`,
      content: '',
      category: filterCat.value
    };
  };

  const saveTemplate = async () => {
    try {
      // Expecting bookingService.saveTemplate to handle updates internally or proxy downstream mutations
      const res = await bookingService.saveTemplate(selectedTemplate.value);
      showToast("Success", "Template saved successfully");
      await fetchTemplates();
      
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

  // --- Reactive Code Validation Rules ---
  const validation = computed(() => {
    const content = selectedTemplate.value?.content || '';
    if (!content) return { isValid: true, message: 'IDLE' };
    try {
      Handlebars.compile(content);
      const opens = (content.match(/{{#/g) || []).length;
      const closes = (content.match(/{{\//g) || []).length;
      if (opens > closes) {
        return { isValid: false, message: 'BLOCK OPEN', errorDetail: 'A logic block is not closed.' };
      }
      return { isValid: true, message: 'SYNTAX OK' };
    } catch (e) {
      return { isValid: false, message: 'ERROR', errorDetail: e.message };
    }
  });

  // --- Dynamic Live/Mock Compilation Utility ---
  const compileTemplate = (content, runtimeData = {}) => {
    if (!content) return '';
    try {
      // Build an evaluation record by ensuring that if names/rooms are empty, fallback options replace them seamlessly
      const contextualPayload = {
        name: runtimeData.name || dummyFallbackData.name,
        surname: runtimeData.surname || dummyFallbackData.surname,
        phone: runtimeData.phone || dummyFallbackData.phone,
        staffName: runtimeData.staffName || dummyFallbackData.staffName,
        total: runtimeData.total !== undefined ? runtimeData.total : dummyFallbackData.total,
        received: runtimeData.received !== undefined ? runtimeData.received : dummyFallbackData.received,
        balance: runtimeData.balance !== undefined ? runtimeData.balance : dummyFallbackData.balance,
        account: runtimeData.account || dummyFallbackData.account,
        rooms: runtimeData.rooms && runtimeData.rooms.length > 0 ? runtimeData.rooms : dummyFallbackData.rooms
      };

      return Handlebars.compile(content)(contextualPayload);
    } catch (err) {
      return 'Compilation formatting breakdown...';
    }
  };

  // --- Textarea Insertion Engine Helpers ---
  const runInsertion = (editorRef, contentValue) => {
    if (!editorRef || !selectedTemplate.value) return;
    
    const start = editorRef.selectionStart;
    const currentText = selectedTemplate.value.content || '';
    
    selectedTemplate.value.content = 
      currentText.substring(0, start) + 
      contentValue + 
      currentText.substring(editorRef.selectionEnd);

    // Reposition cursor immediately behind insertion
    setTimeout(() => {
      editorRef.focus();
      const nextPos = start + contentValue.length;
      editorRef.setSelectionRange(nextPos, nextPos);
    });
  };

  const insertVar = (editorRef, v) => {
    runInsertion(editorRef, `{{${v}}}`);
  };

  const insertSnippet = (editorRef, type) => {
    let snippetStr = "";
    if (type === 'rooms') {
      snippetStr = `{{#each rooms}}\n🏨 {{type}} ({{checkIn}} - {{checkOut}}) | {{adults}} Adults{{#if children}}, {{children}} Children{{/if}}\n{{/each}}`;
    } else if (type === 'ifChild') {
      snippetStr = `{{#if children}} and {{children}} children{{/if}}`;
    } else if (type === 'ifBalance') {
      snippetStr = `{{#if balance}}⚠️ Remaining: {{balance}}₺{{else}}✅ Paid in Full{{/if}}`;
    }
    runInsertion(editorRef, snippetStr);
  };

  const filteredTemplates = computed(() => 
    templates.value.filter(t => t.category === filterCat.value)
  );

  return {
    templates,
    selectedTemplate,
    filterCat,
    filteredTemplates,
    validation,
    fetchTemplates,
    selectTemplate,
    createNewTemplate,
    saveTemplate,
    deleteTemplate,
    insertVar,
    insertSnippet,
    compileTemplate
  };
}