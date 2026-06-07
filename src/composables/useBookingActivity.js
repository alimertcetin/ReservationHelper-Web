// src/composables/useBookingActivity.js
import { ref, watch, computed } from 'vue';
import { bookingService } from '../services/api.js';

// 🔌 Global Shared Context Cache State Singletons
const cache = ref({}); // Structure: { [cacheKey]: { data: [...], totalPages: X, timestamp: Date.now() } }
const searchQuery = ref("");
const isFetching = ref(false);
const isFetchingTimeoutStarted = ref(false);

const currentPage = ref(1);
const totalPages = ref(1);
const itemsPerPage = ref(6);

const fillFormModalActive = ref(false);
const selectedResData = ref(null);
const reservationToLoadTrigger = ref(null);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes in Milliseconds
let searchTimeout = null;

export function useBookingActivity() {

  // Generates a predictable unique key depending on query context and page scope
  const getCacheKey = () => {
    const queryStr = searchQuery.value.trim().toLowerCase();
    return queryStr 
      ? `search_${queryStr}_page_${currentPage.value}`
      : `default_page_${currentPage.value}`;
  };

  // Checks if we have valid, non-expired data in memory
  const getValidCacheEntry = (key) => {
    const entry = cache.value[key];
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      delete cache.value[key]; // Clean up memory
      return null;
    }
    return entry;
  };

  const fetchReservations = async () => {
    const key = getCacheKey();
    const cachedEntry = getValidCacheEntry(key);

    // 🎯 Rule: Return data immediately from cache if it exists and hasn't expired
    if (cachedEntry) {
      totalPages.value = cachedEntry.totalPages;
      return;
    }

    isFetching.value = true;
    try {
      const queryStr = searchQuery.value.trim();
      let reservations = [];
      let serverTotalPages = 1;

      if (queryStr) {
        // Updated search endpoint to accept pagination parameters
        const apiRes = await bookingService.searchReservation(queryStr, {
          page: currentPage.value,
          limit: itemsPerPage.value
        });
        
        if (Array.isArray(apiRes.data)) {
          reservations = apiRes.data;
        } else if (apiRes.data && Array.isArray(apiRes.data.reservations)) {
          reservations = apiRes.data.reservations;
        }
        serverTotalPages = apiRes.data?.totalPages || 1;
      } else {
        const res = await bookingService.getRecentBookings(currentPage.value, itemsPerPage.value);
        reservations = res.data?.reservations || [];
        serverTotalPages = res.data?.totalPages || 1;
      }

      // Write freshly fetched dataset into page cache bucket
      cache.value[key] = {
        data: reservations,
        totalPages: serverTotalPages,
        timestamp: Date.now()
      };

      totalPages.value = serverTotalPages;

    } catch (err) {
      console.error("Failed to sync activity timeline layout stream:", err);
    } finally {
      isFetching.value = false;
    }
  };

  // Computed data selector targeting only the active view slice
  const reservationsToDisplay = computed(() => {
    const key = getCacheKey();
    return cache.value[key]?.data || [];
  });

  // 🔄 Clear cache completely when a mutation event occurs (new booking/update)
  const invalidateCache = () => {
    cache.value = {};
    fetchReservations();
  };

  // Listen for direct navigation page targets
  watch(currentPage, () => {
    fetchReservations();
  });

  // Watch inputs and apply standard debounce delays
  watch(searchQuery, () => {
    isFetchingTimeoutStarted.value = true;
    clearTimeout(searchTimeout);
    currentPage.value = 1; 

    searchTimeout = setTimeout(() => {
      isFetchingTimeoutStarted.value = false;
      fetchReservations();
    }, 350);
  });

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages.value) {
      currentPage.value = pageNumber;
    }
  };

  const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
  const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

  const selectReservationCard = (reservation) => {
    selectedResData.value = reservation;
    fillFormModalActive.value = true;
  };

  const confirmLoadAction = () => {
    if (selectedResData.value) {
      reservationToLoadTrigger.value = { ...selectedResData.value, _ts: Date.now() };
      fillFormModalActive.value = false;
    }
  };

  return {
    searchQuery,
    currentPage,
    totalPages,
    reservationsToDisplay,
    isFetching,
    isFetchingTimeoutStarted,
    fillFormModalActive,
    selectedResData,
    reservationToLoadTrigger,
    goToPage,
    nextPage,
    prevPage,
    fetchRecent: fetchReservations, // Keep alias for mounting lifecycle hook syncs
    invalidateCache,                // Expose to clear cache when a new booking saves successfully
    selectReservationCard,
    confirmLoadAction
  };
}