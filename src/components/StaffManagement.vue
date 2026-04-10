<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <h2 class="text-2xl font-bold dark:text-white">Staff Management</h2>

    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 class="text-sm font-bold uppercase opacity-60 mb-4">Add New Team Member</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase ml-1">Full Name</label>
          <input v-model="newStaff.name" class="modern-input" placeholder="e.g. Jane Doe">
        </div>
        
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase ml-1">System Role</label>
          <select v-model="newStaff.role" class="modern-input">
            <option value="ADMIN">ADMIN</option>
            <option value="RECEPTIONIST">RECEPTIONIST</option>
          </select>
        </div>

        <button @click="saveStaff" :disabled="loading" class="bg-teal-500 hover:bg-teal-600 text-white font-bold p-3 rounded-xl transition-all disabled:opacity-50">
          {{ loading ? 'Saving...' : 'Add Member' }}
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold opacity-60">
          <tr>
            <th class="p-4">Name</th>
            <th class="p-4">Role</th>
            <th class="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="member in staffList" :key="member.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <td class="p-4 font-medium">{{ member.name }}</td>
            <td class="p-4">
              <span :class="member.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'" 
                    class="px-2 py-1 rounded-md text-[10px] font-bold">
                {{ member.role }}
              </span>
            </td>
            <td class="p-4 text-right">
              <button @click="removeStaff(member.id)" class="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bookingService } from '../services/api'
import { useToast } from '../composables/useToast'

const { showToast } = useToast()
const staffList = ref([])
const loading = ref(false)
const newStaff = ref({ name: '', role: 'RECEPTIONIST' })

const fetchStaff = async () => {
  try {
    const res = await bookingService.getStaff()
    staffList.value = res.data
  } catch (err) {
    showToast("Error", "Could not load staff list", "error")
  }
}

const saveStaff = async () => {
  if (!newStaff.value.name) return showToast("Required", "Please enter a name", "error")
  
  loading.value = true
  try {
    await bookingService.createStaff(newStaff.value)
    showToast("Success", `${newStaff.value.name} added to the team.`)
    newStaff.value.name = '' // Reset form
    await fetchStaff() // Refresh list
  } catch (err) {
    showToast("Error", "Failed to save staff member", "error")
  } finally {
    loading.value = false
  }
}

const removeStaff = async (id) => {
  if (!confirm("Are you sure? This will not delete their past bookings.")) return
  
  try {
    await bookingService.deleteStaff(id)
    showToast("Deleted", "Staff member removed.")
    await fetchStaff()
  } catch (err) {
    showToast("Error", "Could not delete member", "error")
  }
}

onMounted(fetchStaff)
</script>

<style scoped>
</style>