// src/composables/useBookingLogic.js
import { computed } from 'vue';

export function useBookingLogic(form, roomTypes) {

  // 1. Calculate dynamic room totals based on days and flat pricing configuration rates
  const calculateTotalFromRooms = () => {
    if (!form.value || !Array.isArray(form.value.rooms)) return 0;
    
    return form.value.rooms.reduce((acc, room) => {
      if (!room.checkIn || !room.checkOut) return acc + Number(room.price || 0);

      const start = new Date(room.checkIn);
      const end = new Date(room.checkOut);
      const diffTime = end - start;
      
      // Prevent calculation anomalies on backward selections
      const days = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 1;
      
      return acc + (Number(room.price || 0) * days);
    }, 0);
  };

  // 2. Track ledger payments against the absolute total amount charged
  const balance = computed(() => {
    const totalCharged = Number(form.value?.total || 0);
    
    if (!form.value || !Array.isArray(form.value.payments)) {
      return totalCharged;
    }

    const totalPaid = form.value.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount || 0);
    }, 0);

    return totalCharged - totalPaid;
  });

  // 3. Room Management Block Methods
  const addRoom = () => {
    const defaultRoomType = roomTypes.value?.[0]?.id || null;
    const defaultPrice = roomTypes.value?.[0]?.defaultPrice || 0;

    form.value.rooms.push({
      roomTypeId: defaultRoomType,
      checkIn: '',
      checkOut: '',
      adults: 2,
      children: 0,
      price: Number(defaultPrice)
    });
  };

  const removeRoom = (index) => {
    if (form.value.rooms.length > 1) {
      form.value.rooms.splice(index, 1);
    }
  };

  // 4. Safely map external activity stream entries straight into internal view states
  const loadReservation = (reservationData) => {
    if (!reservationData) return;

    // Map structural core guest info
    form.value.name = reservationData.guest?.firstName || '';
    form.value.surname = reservationData.guest?.lastName || '';
    form.value.phone = reservationData.guest?.phone || '';
    form.value.staffId = reservationData.staffId || 1;
    form.value.total = Number(reservationData.totalAmount || 0);

    // Reconstruct structural dynamic room stay segments
    const underlyingRooms = reservationData.rooms || reservationData.reservationRooms || [];
    if (underlyingRooms.length > 0) {
      form.value.rooms = underlyingRooms.map(r => {
        // Convert ISO timestamps securely down to clean YYYY-MM-DD input formats
        const formatInputDate = (isoStr) => {
          if (!isoStr) return '';
          return isoStr.split('T')[0];
        };

        return {
          id: r.id,
          roomTypeId: r.roomTypeId,
          checkIn: formatInputDate(r.startDate || r.checkIn),
          checkOut: formatInputDate(r.endDate || r.checkOut),
          adults: r.adults ?? 2,
          children: r.children ?? 0,
          price: Number(r.price || 0)
        };
      });
    } else {
      // Fallback baseline layout safety frame 
      form.value.rooms = [];
      addRoom();
    }
  };

  return {
    balance,
    addRoom,
    removeRoom,
    calculateTotalFromRooms,
    loadReservation
  };
}