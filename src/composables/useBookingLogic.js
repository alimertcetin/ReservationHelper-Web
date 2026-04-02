import { computed } from 'vue'
import { useToast } from './useToast'

export function useBookingLogic(form, roomTypes) {
  const { showToast } = useToast()

  const balance = computed(() => (form.total || 0) - (form.received || 0))

  const addRoom = () => {
    const lastRoom = form.rooms[form.rooms.length - 1]
    form.rooms.push({
      id: Date.now(),
      type: lastRoom ? lastRoom.type : roomTypes[0],
      dates: lastRoom ? lastRoom.dates : '',
      price: lastRoom ? lastRoom.price : 0,
      adults: lastRoom ? lastRoom.adults : 2,
      children: lastRoom ? lastRoom.children : 0
    })
    showToast("Room Added", "Details copied from previous stay.")
  }

  const removeRoom = (index) => {
    form.rooms.splice(index, 1)
  }

  const calculateTotalFromRooms = () => {
    const sum = form.rooms.reduce((acc, room) => acc + (Number(room.price) || 0), 0)
    form.total = sum
  }

  const loadReservation = (data) => {
    // 1. Map top-level fields
    form.name = data.name || '';
    form.surname = data.surname || '';
    form.phone = data.phone || '';
    form.staffName = data.staffName || '';
    form.total = data.total || 0;
    form.received = data.received || 0;

    // 2. Handle Rooms (Crucial: Ensure it's an array and has IDs for Vue's :key)
    if (data.rooms && Array.isArray(data.rooms)) {
      form.rooms = data.rooms.map(r => ({
        id: r.id || Date.now() + Math.random(),
        type: r.type || roomTypes[0],
        dates: r.dates || '',
        price: r.price || 0,
        adults: r.adults || 2,
        children: r.children || 0
      }));
    } else if (data.room) { 
      // Fallback for old data structure
      form.rooms = [{
        id: Date.now(),
        type: data.room,
        dates: '',
        price: data.total || 0,
        adults: 2,
        children: 0
      }];
    }
  };

  return { balance, addRoom, removeRoom, calculateTotalFromRooms, loadReservation }
}