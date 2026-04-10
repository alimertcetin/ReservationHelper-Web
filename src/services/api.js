import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5005/api'
});

export const bookingService = {
  // Save new or update existing
  saveReservation: (payload) => api.post('/reservations', payload),
  
  // Search guests for the search bar
  searchGuests: (query) => api.get(`/guests/search?q=${query}`),
  
  // Get all staff for the datalist
  getStaff: () => api.get('/staff'),
  createStaff: (data) => api.post('/staff', data),
  updateStaff: (id, data) => api.put(`/staff/${id}`, data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),
  
  // add new staff
  addStaff: (staff) => api.post('/staff', staff),
  
  // Get dynamic price from the rules engine
  getSuggestedPrice: (params) => api.get('/prices/suggest', { params }),
  
  // Get recent bookings for the Activity Sidebar
  getRecentBookings: () => api.get('/reservations/recent'),

  createPriceRule: (data) => api.post('/prices', data),
  deletePriceRule: (id) => api.delete(`/prices/${id}`),
  getPriceRules: () => api.get('/prices/all'),
  
  getRoomTypes: () => api.get('/roomTypes/all'),
  
  // Update this to match your PUT /sync endpoint
  syncPriceRules: (rules) => api.put('/prices/sync', { rules }),
};