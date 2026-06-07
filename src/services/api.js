// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/api'
});

export const bookingService = {
  // --- RESERVATIONS ---
  createReservation: (payload) => api.post('/reservations', payload),
  updateReservation: (id, data) => api.put(`/reservations/${id}`, data),
  getReservations: (start, end) => api.get('/reservations', { params: { start, end } }),
  
  // Clean delivery mapping matching your new paginated JSON envelope format!
  getRecentBookings: async (page = 1, limit = 6) => {
    const response = await api.get(`/reservations/recent?page=${page}&limit=${limit}`);
    
    // Safety check map to keep transactional data structurally intact
    if (response.data && Array.isArray(response.data.reservations)) {
      response.data.reservations = response.data.reservations.map(reservation => ({
        ...reservation,
        payments: reservation.transactions || []
      }));
    }
    return response;
  },

  // Pure fuzzy string searches matching your raw unpaginated format
  searchReservation: async (guestDataQuery) => {
    const response = await api.get(`/reservations/search?q=${encodeURIComponent(guestDataQuery)}`);
    
    if (Array.isArray(response.data)) {
      response.data = response.data.map(reservation => ({
        ...reservation,
        payments: reservation.transactions || []
      }));
    }
    return response;
  },
  
  // Payments
  addPayment: (resId, paymentData) => api.post(`/reservations/${resId}/pay`, paymentData),

  // --- GUESTS ---
  searchGuests: (query) => api.get(`/guests/search?q=${query}`),
  
  // --- STAFF ---
  getStaff: () => api.get('/staff'),
  createStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.put(`/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),

  // --- POLICIES ---
  getPolicies: () => api.get('/policies'),
  createPolicy: (data) => api.post('/policies', data),
  deletePolicy: (id) => api.delete(`/policies/${id}`),

  // --- ACCOUNTS & OWNERS ---
  getOwners: () => api.get('/owners?includeInactive=true'),
  createOwner: (data) => api.post('/owners', data),
  deleteOwner: (id) => api.delete(`/owners/${id}`),
  
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
  // (Frontend passes adults/children/overrides)
  getSuggestedPrice: (params) => api.get('/prices/suggest', { 
    params: {
      ...params,
      // Stringify overrides if they exist so they pass through URL params correctly
      policies: params.policies ? JSON.stringify(params.policies) : undefined
    } 
  }),
  getPriceRules: () => api.get('/prices/all'),
  syncPriceRules: (rules) => api.put('/prices/sync', { rules }),

  // --- TEMPLATES ---
  getTemplates: () => api.get('/templates'),
  saveTemplate: (data) => api.post('/templates', data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
};