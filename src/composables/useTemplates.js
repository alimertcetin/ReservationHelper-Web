// src/composables/useTemplates.js
import { ref, watch } from 'vue';
import '../utils/handlebars-helpers.js';
import { bookingService } from '../services/api.js';
import { useToast } from './useToast';
import { useBookingLogic } from './useBookingLogic.js';

// Shared global singleton states so both views stay automatically in-sync
const templates = ref([]);
const selectedTemplate = ref(null);
const filterCat = ref('GUEST');

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

  fetchTemplates();

  return {
    templates,
    selectedTemplate,
    filterCat,
    fetchTemplates,
    selectTemplate,
    createNewTemplate,
    saveTemplate,
    deleteTemplate,
  };
}