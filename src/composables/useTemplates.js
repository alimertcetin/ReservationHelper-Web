// composables/useTemplates.js
import { ref } from "vue";
import Handlebars from "handlebars";
import { useToast } from "./useToast"; // Assuming useToast is globally accessible

// Declared OUTSIDE the composable = Single Shared Global State Cache
const availableTemplates = ref([]);

export function useTemplates(dependencies = {}) {
  const { showToast } = useToast();
  
  // Unpack dependencies safely with fallback empty refs if omitted
  const form = dependencies.form; // This is a ref or defineModel wrapper passed down
  const balance = dependencies.balance || ref(0);
  const roomTypes = dependencies.roomTypes || ref([]);
  const staffMembers = dependencies.staffMembers || ref([]);
  const accounts = dependencies.accounts || ref([]);

  const generatedText = ref("");
  const selectedTemplate = ref(null);
  const showPreviewModal = ref(false);
  const showTemplateDropdown = ref(false);

  const setTemplates = (templatesList) => {
    availableTemplates.value = [...templatesList];
  };

  const openPreview = (templateItem) => {
    if (!form || !form.value) {
      console.warn("useTemplates: Form reference missing during initialization.");
      return;
    }

    try {
      // Avoid variable shadowing by naming the compiled generator function cleanly
      const compileTemplate = Handlebars.compile(templateItem.content);

      // Map out the layout structures using the provided reactive references
      const data = {
        ...form.value,
        balance: balance.value,

        rooms: form.value.rooms?.map((r) => ({
          ...r,
          type: roomTypes.value.find((t) => t.id === r.roomTypeId)?.name || "NULL",
        })) || [],

        staffName: staffMembers.value.find((p) => p.id == form.value.staffId)?.name || "NULL",

        payments: form.value.payments?.map((payment) => {
          const account = accounts.value.find((acc) => acc.id === payment.accountId);
          return {
            ...payment,
            accountName: account?.name || "NULL",
            accountType: account?.type || "NULL"
          };
        }) || [],
      };

      generatedText.value = compileTemplate(data);
      selectedTemplate.value = templateItem;
      showPreviewModal.value = true;
      showTemplateDropdown.value = false;
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Template Error", "Check Handlebars syntax", "error");
    }
  };

  return {
    availableTemplates,
    generatedText,
    selectedTemplate,
    showPreviewModal,
    showTemplateDropdown,
    setTemplates,
    openPreview,
  };
}