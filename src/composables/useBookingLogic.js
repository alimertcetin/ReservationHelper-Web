// composables/useBookingLogic.js
import { computed } from 'vue'

export function useBookingLogic(form) {
  
  const balance = computed(() => {
    return (form.total || 0) - (form.received || 0);
  });

  const addRoom = () => {
    form.rooms.push({
      id: Date.now(),
      roomTypeId: null, // Use ID, not name
      checkIn: null,
      checkOut: null,
      adults: 2,
      children: 0,
      price: 0
    });
  };

  const removeRoom = (index) => {
    if (form.rooms.length > 1) {
      form.rooms.splice(index, 1);
    }
  };

  const calculateTotalFromRooms = () => {
    form.total = form.rooms.reduce((acc, room) => acc + (Number(room.price) || 0), 0);
  };

  const loadReservation = (data) => {
    // Mapping incoming DB data to our strict form state
    form.name = data.guest.firstName;
    form.surname = data.guest.lastName;
    form.phone = data.guest.phone;
    form.total = Number(data.totalAmount);
    form.received = Number(data.received || 0);
    form.rooms = data.rooms.map(r => ({
      id: r.id,
      roomTypeId: r.roomTypeId,
      checkIn: r.startDate.split('T')[0],
      checkOut: r.endDate.split('T')[0],
      adults: r.adults,
      children: r.children,
      price: Number(r.price)
    }));
  };

  return {
    balance,
    addRoom,
    removeRoom,
    calculateTotalFromRooms,
    loadReservation
  };
}