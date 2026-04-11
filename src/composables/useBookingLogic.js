// composables/useBookingLogic.js
import { computed } from 'vue'
import { dateToData } from '../utils/utility'

export function useBookingLogic(form, roomTypes) {
  
  const balance = computed(() => {
    return (form.total || 0) - (form.received || 0);
  });

  const addDays = (originalDate, days) => {
    let date;
    if (typeof originalDate === 'string') {
      // Split the YYYY-MM-DD to avoid timezone shifting
      const [y, m, d] = originalDate.split('-').map(Number);
      date = new Date(y, m - 1, d); 
    } else {
      date = new Date(originalDate);
    }
    
    date.setDate(date.getDate() + days);
    
    // Return in YYYY-MM-DD format manually to be safe
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addRoom = (roomTypes) => {
    const lastRoom = form.rooms.at(-1);
    console.log(JSON.stringify(lastRoom, null, 2));
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    form.rooms.push({
      id: crypto.randomUUID(), // Use this for better uniqueness
      roomTypeId: lastRoom?.roomTypeId ?? roomTypes?.value[0]?.id ?? 0,
      renderKey: Date.now(),
      // If there's a last room, copy its dates, otherwise use today/tomorrow
      checkIn: lastRoom?.checkIn ?? todayStr,
      checkOut: lastRoom?.checkOut ?? addDays(todayStr, 1),
      adults: lastRoom?.adults ?? 2,
      children: lastRoom?.children ?? 0,
      price: lastRoom?.price ?? 0
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