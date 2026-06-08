// src/composables/useBookingLogic.js
import { ref, computed, watch, nextTick } from 'vue';
import { useToast } from '../composables/useToast'
import { useBookingActivity } from './useBookingActivity';
import { bookingService } from '../services/api.js'

const bookingForm = ref({
  name: '',
  surname: '',
  phone: '',
  staff: {},
  rooms: [],
  total: 0,
  received: 0,
  payments: [],
});
const roomTypes = ref([])
const staffMembers = ref([])
const accounts = ref([])
const pricePolicies = ref([])
const currentReservationId = ref(null)

const { reservationToLoadTrigger, fetchRecent, invalidateCache } = useBookingActivity();

try {
  const [staffRes, roomTypeRes, accountsRes, policiesRes] = await Promise.all([
    bookingService.getStaff(),
    bookingService.getRoomTypes(),
    bookingService.getAccounts(),
    bookingService.getPolicies()
  ]);

  staffMembers.value = staffRes.data;
  roomTypes.value = roomTypeRes.data;
  accounts.value = accountsRes.data;
  pricePolicies.value = policiesRes.data;
}
catch(err) {
  console.error(err);
  useToast().showToast("Error", "Initialization failed", "error");
}

export function useBookingLogic() {

  const { showToast } = useToast();

  // 💡 The Bridge: Watch for card selections coming out of the sidebar component
  watch(reservationToLoadTrigger, (newData) => {
    if (!newData) return;
    
    // Apply changes to the local form state
    currentReservationId.value = newData.id;
    
    bookingForm.value.staff = staffMembers.value.find(p => p.id === newData.staffId) || {};
    bookingForm.value.name = newData.guest.firstName;
    bookingForm.value.surname = newData.guest.lastName;
    bookingForm.value.phone = newData.guest.phone;
    bookingForm.value.total = Number(newData.totalAmount);
    bookingForm.value.received = Number(newData.received || 0);
    
    bookingForm.value.rooms = newData.rooms.map(r => ({
      id: r.id,
      roomTypeId: r.roomTypeId,
      checkIn: r.startDate.split('T')[0],
      checkOut: r.endDate.split('T')[0],
      adults: r.adults,
      children: r.children,
      price: Number(r.price)
    }));
    
    bookingForm.value.payments = [];

    nextTick(() => {
      const paymentsList = newData.payments || newData.transactions || [];
      if (paymentsList.length > 0) {
        paymentsList.forEach(payment => {
          bookingForm.value.payments.push({
            amount: payment.amount || null,
            method: payment.method || null,
            accountId: payment.accountId,
            reservationId: currentReservationId.value
          });
        });
      }
    });

    showToast("Form Loaded", `${newData.guest.firstName} ${newData.guest.lastName}'s data sync verified.`);
  });

  // 1. Calculate dynamic room totals based on days and flat pricing configuration rates
  const calculateTotalFromRooms = computed(() => bookingForm.value.rooms.reduce((acc, rm) => acc + (Number(rm.price) || 0), 0));

  // 2. Track ledger payments against the absolute total amount charged
  const balance = computed(() => {
    const totalCharged = Number(bookingForm.value?.total || 0);
    
    if (!bookingForm.value || !Array.isArray(bookingForm.value.payments)) {
      return totalCharged;
    }

    const totalPaid = bookingForm.value.payments.reduce((sum, payment) => {
      return sum + Number(payment.amount || 0);
    }, 0);

    return totalCharged - totalPaid;
  });  

  const computedReceivedTotal = computed(() => bookingForm.value.payments?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0);
  const computedTotalPrice = computed(() => bookingForm.value.rooms?.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0) || 0);

  watch(computedReceivedTotal, (newVal) => { bookingForm.value.received = newVal; });
  watch(computedTotalPrice, (newVal) => { bookingForm.value.total = newVal; });

  const addDays = (originalDate, days) => {
    const [y, m, d] = originalDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 3. Room Management Block Methods
  const addRoom = () => {
    const lastRoom = bookingForm.value.rooms.at(-1);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    bookingForm.value.rooms.push({
      id: uniqueId,
      roomTypeId: lastRoom?.roomTypeId ?? roomTypes.value[0]?.id ?? 0,
      checkIn: lastRoom?.checkIn ?? todayStr,
      checkOut: lastRoom?.checkOut ?? addDays(todayStr, 1),
      adults: lastRoom?.adults ?? 2,
      children: lastRoom?.children ?? 0,
      price: lastRoom?.price ?? 0
    });
  };

  const removeRoom = (index) => {
    if (bookingForm.value.rooms.length > 1) {
      bookingForm.value.rooms.splice(index, 1);
    }
  };

  const addPaymentItem = (payment = null) => {
    if (!bookingForm.value.payments) bookingForm.value.payments = [];
    bookingForm.value.payments.push({
      amount: payment ? payment.amount : null,
      method: payment ? payment.method : null,
      accountId: payment ? payment.accountId : null,
      reservationId: currentReservationId.value || -1,
    });
  };
  const removePaymentItem = (index) => { bookingForm.value.payments.splice(index, 1); };

  const resetForm = () => {
    currentReservationId.value = null;
    Object.assign(bookingForm.value, {
      name: "", surname: "", phone: "", total: 0, received: 0,
      staff: staffMembers.value[0] || null, rooms: [], payments: []
    });
    addRoom();
  };

  const handleSave = async () => {
    try {
      const payload = {
        guest: { firstName: bookingForm.value.name, lastName: bookingForm.value.surname, phone: bookingForm.value.phone },
        staffId: bookingForm.value.staff?.id || null,
        totalAmount: bookingForm.value.total,
        payments: bookingForm.value.payments,
        rooms: bookingForm.value.rooms.map(r => ({
          roomTypeId: r.roomTypeId, startDate: r.checkIn, endDate: r.checkOut,
          adults: r.adults, children: r.children, price: r.price
        }))
      };

      if (!payload.guest.firstName || !payload.guest.lastName || !payload.guest.phone) throw new Error("Guest details required.");

      let response = currentReservationId.value 
        ? await bookingService.updateReservation(currentReservationId.value, payload)
        : await bookingService.createReservation(payload);

      showToast("Success", `Reservation #${response.data.id} saved.`);

      // Call recent activity update over the composable layer context cleanly!
      invalidateCache();
      fetchRecent();
      
      if (!currentReservationId.value) resetForm();
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  // 4. Safely map external activity stream entries straight into internal view states
  const loadReservation = (reservationData) => {
    if (!reservationData) return;

    // Map structural core guest info
    bookingForm.value.name = reservationData.guest?.firstName || '';
    bookingForm.value.surname = reservationData.guest?.lastName || '';
    bookingForm.value.phone = reservationData.guest?.phone || '';
    bookingForm.value.staff = staffMembers.value.find(p => p.id === reservationData.staffId) || {};
    bookingForm.value.total = Number(reservationData.totalAmount || 0);

    // Reconstruct structural dynamic room stay segments
    const underlyingRooms = reservationData.rooms || reservationData.reservationRooms || [];
    if (underlyingRooms.length > 0) {
      bookingForm.value.rooms = underlyingRooms.map(r => {
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
      bookingForm.value.rooms = [];
      addRoom();
    }
  };

  return { 
      bookingForm,
      currentReservationId,
      staffMembers,
      roomTypes,
      accounts,
      pricePolicies,
      balance,
      addRoom,
      removeRoom,
      addPaymentItem,
      removePaymentItem,
      resetForm,
      handleSave,
      calculateTotalFromRooms,
      loadReservation
    };
}