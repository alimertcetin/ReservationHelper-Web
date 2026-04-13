<template>
  <div class="p-6 max-w-6xl mx-auto space-y-8">
    <header class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold dark:text-white">Room Types</h1>
        <p class="text-slate-500 text-sm">Define your room categories and default guest capacities.</p>
      </div>
      <button @click="openModal()" class="bg-teal-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:bg-teal-600 transition-all">
        + New Room Type
      </button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="type in roomTypes" :key="type.id" 
           class="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
        
        <div class="flex justify-between items-start mb-4">
          <div class="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <span class="text-xl">🛏️</span>
          </div>
          <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="openModal(type)" class="p-2 text-slate-400 hover:text-teal-500">Edit</button>
            <button @click="handleDelete(type.id)" class="p-2 text-slate-400 hover:text-rose-500">Delete</button>
          </div>
        </div>

        <h3 class="text-lg font-bold dark:text-white">{{ type.name }}</h3>
        <p class="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">{{ type.description || 'No description provided.' }}</p>
        
        <div class="mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-widest opacity-40">Default Capacity</span>
          <span class="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-mono font-bold text-xs dark:text-white">
            {{ type.capacity }} Guests
          </span>
        </div>
      </div>
    </div>

    <div v-if="roomTypes.length === 0" class="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
      <p class="text-slate-400 italic">No room types defined yet. Click "New Room Type" to start.</p>
    </div>

    <CustomModal :show="showModal" :title="isEditing ? 'Edit Room Type' : 'New Room Type'" @confirm="submitForm" @cancel="showModal = false">
      <template #message>
        <div class="space-y-4 text-left">
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Room Type Name</label>
            <input v-model="form.name" class="modern-input" placeholder="e.g. Deluxe King Suite">
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Description</label>
            <textarea v-model="form.description" class="modern-input h-24 resize-none" placeholder="Briefly describe the amenities..."></textarea>
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50">Base Capacity (Persons)</label>
            <div class="flex items-center gap-4 mt-1">
              <input type="range" v-model.number="form.capacity" min="1" max="10" class="flex-1 accent-teal-500">
              <span class="font-mono font-bold text-teal-500 w-8 text-center">{{ form.capacity }}</span>
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
const roomTypes = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = ref({
  name: '',
  description: '',
  capacity: 2
});

const fetchRoomTypes = async () => {
  try {
    const res = await bookingService.getRoomTypes();
    roomTypes.value = res.data;
  } catch (err) {
    showToast("Error", "Failed to load room types", "error");
  }
};

const openModal = (type = null) => {
  if (type) {
    isEditing.value = true;
    editingId.value = type.id;
    form.value = { ...type };
  } else {
    isEditing.value = false;
    editingId.value = null;
    form.value = { name: '', description: '', capacity: 2 };
  }
  showModal.value = true;
};

const submitForm = async () => {
  if (!form.value.name) return showToast("Required", "Please enter a name", "error");

  try {
    if (isEditing.value) {
      await bookingService.updateRoomType(editingId.value, form.value);
      showToast("Updated", "Room type updated successfully");
    } else {
      await bookingService.createRoomType(form.value);
      showToast("Created", "New room type added");
    }
    showModal.value = false;
    fetchRoomTypes();
  } catch (err) {
    showToast("Error", "Save failed. Name might already exist.", "error");
  }
};

const handleDelete = async (id) => {
  if (!confirm("Are you sure? This might affect existing bookings if they are linked to this type.")) return;
  try {
    await bookingService.deleteRoomType(id);
    showToast("Deleted", "Room type removed");
    fetchRoomTypes();
  } catch (err) {
    showToast("Error", "Could not delete. Type might be in use by active reservations.", "error");
  }
};

onMounted(fetchRoomTypes);
</script>

<style scoped>
  @reference '../style.css'
.modern-input {
  @apply w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-xs dark:text-white mt-1;
}
</style>