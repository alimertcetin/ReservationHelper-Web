const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

createApp({
    setup() {
        // UI Control
        const isDark = ref(localStorage.getItem('theme') === 'dark');
        const currentPage = ref('bookings');
        const sidebarOpen = ref(false);
        const guestDropdown = ref(false);
        const loading = ref(true);

        // Configuration
        const roomTypes = ['Standard Room', 'Deluxe Suite', 'Family Room', 'King Suite'];
        const menu = ref([
            { id: 'bookings', label: 'New Booking', icon: '🏨', enabled: true },
            { id: 'rooms', label: 'Room List', icon: '🛏️', enabled: true },
            { id: 'accounts', label: 'Bank Info', icon: '💳', enabled: true },
            { id: 'settings', label: 'Settings', icon: '⚙️', enabled: true }
        ]);

        // Form State (Persistent across navigation)
        const form = reactive({
            roomType: 'Standard Room',
            dates: '',
            name: '',
            surname: '',
            phone: '',
            adults: 2,
            children: 0,
            total: null,
            received: null
        });

        const initDatePicker = () => {
            // nextTick ensures Vue has finished rendering the HTML 
            // after the page switch before we look for #datePicker
            nextTick(() => {
                const el = document.querySelector("#datePicker");
                if (el) {
                    flatpickr(el, {
                        mode: "range",
                        dateFormat: "d-m-Y",
                        defaultDate: form.dates ? form.dates.split(' to ') : null,
                        onChange: (selectedDates, dateStr) => { 
                            form.dates = dateStr; 
                        }
                    });
                }
            })
        };

        watch(currentPage, (newPage) => {
            if (newPage === 'bookings') {
                initDatePicker();
            }
        });

        const recent = ref([]);

        // Computed
        const balance = computed(() => (form.total || 0) - (form.received || 0));

        // Methods
        const toggleDark = () => {
            isDark.value = !isDark.value;
        };

        const changeGuest = (type, delta) => {
            if (type === 'adults') form.adults = Math.max(1, form.adults + delta);
            else form.children = Math.max(0, form.children + delta);
        };

        const formatCurrency = (val) => {
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
        };

        const saveReservation = () => {
            if(!form.name || !form.dates) return alert("Please fill at least Name and Dates.");
            alert("Reservation Saved Successfully!");
        };

        const sendWhatsApp = () => {
            const cleanPhone = form.phone.replace(/\D/g, '');
            const message = `Booking for ${form.name} ${form.surname} on ${form.dates}`;
            window.open(`https://wa.me/90${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        };

        const copyGuest = () => {
            navigator.clipboard.writeText(`${form.name} ${form.surname} - ${form.phone}`);
            alert("Guest info copied!");
        };

        // Theme Watcher (The bridge between Vue and your V4 Tailwind)
        watch(isDark, (val) => {
            if (val) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }, { immediate: true });

        onMounted(() => {
            // Initial load
            if (currentPage.value === 'bookings') {
                initDatePicker();
            }

            // Simulate Data Fetch
            setTimeout(() => {
                recent.value = [
                    { id: 1, name: 'Mert', surname: 'Demir', time: 'Just now', room: 'King Suite', guests: '2+1', total: '₺12.400' },
                    { id: 2, name: 'Selin', surname: 'Akasya', time: '2h ago', room: 'Standard', guests: '2', total: '₺3.500' }
                ];
                loading.value = false;
            }, 1000);
        });

        return {
            isDark, toggleDark, currentPage, sidebarOpen, menu, form, 
            guestDropdown, roomTypes, balance, formatCurrency, 
            recent, loading, changeGuest, saveReservation, sendWhatsApp, copyGuest
        };
    }
}).mount('#app');