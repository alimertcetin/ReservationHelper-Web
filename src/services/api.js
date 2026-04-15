import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/api'
});

export const bookingService = {
  // --- RESERVATIONS ---
  // payload can be new reservation or update data
  createReservation: (payload) => api.post('/reservations', payload),
  updateReservation: (id, data) => api.put(`/reservations/${id}`, data),
  
  // Get by range: bookingService.getReservations('2026-01-01', '2026-01-31')
  getReservations: (start, end) => api.get('/reservations', { params: { start, end } }),
  getRecentBookings: () => api.get('/reservations/recent'),
  
  // Payments
  addPayment: (resId, paymentData) => api.post(`/reservations/${resId}/pay`, paymentData),

  // --- GUESTS ---
  searchGuests: (query) => api.get(`/guests/search?q=${query}`),
  
  // --- STAFF ---
  getStaff: () => api.get('/staff'),
  createStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.put(`/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),

  // --- ACCOUNTS & OWNERS ---
  getOwners: () => api.get('/accounts/owners?includeInactive=true'),
  createOwner: (data) => api.post('/accounts/owners', data),
  deleteOwner: (id) => api.delete(`/accounts/owners/${id}`),
  
  getAccounts: () => api.get('/accounts'),
  createAccount: (data) => api.post('/accounts', data),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  
  // --- ROOM TYPES ---
  getRoomTypes: () => api.get('/roomTypes/all'),
  createRoomType: (data) => api.post('/roomTypes', data),
  updateRoomType: (id, data) => api.put(`/roomTypes/${id}`, data),
  deleteRoomType: (id) => api.delete(`/roomTypes/${id}`),
  
  // --- PRICING ---
  getSuggestedPrice: (params) => api.get('/prices/suggest', { params }),
  getPriceRules: () => api.get('/prices/all'),
  syncPriceRules: (rules) => api.put('/prices/sync', { rules }),
};