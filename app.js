// ======= ELEMENTS =======
const guestDropdown = document.getElementById("guestDropdown");
const guestSummary = document.getElementById("guestSummary");
const adultCountText = document.getElementById("adultCount");
const childCountText = document.getElementById("childCount");

const totalPaymentInput = document.getElementById("totalPayment");
const receivedPaymentInput = document.getElementById("receivedPayment");
const remainingPaymentInput = document.getElementById("remainingPayment");

const guestNameInput = document.getElementById("guestName");
const guestSurnameInput = document.getElementById("guestSurname");
const guestPhoneInput = document.getElementById("guestPhone");

// Global Durumlar
let adults = 2;
let children = 0;

// ======= INITIALIZATION =======
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initFlatpickr();
    updateMoney(); // Başlangıçta 0 değerlerini formatla
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function initFlatpickr() {
    // Kütüphane yüklenmiş mi kontrol et
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#dateRange", {
            mode: "range",
            minDate: "today",
            dateFormat: "d-m-Y",
            // locale: "tr" // Eğer hata verirse şimdilik yorumda kalsın
        });
    } else {
        console.error("Flatpickr kütüphanesi yüklenemedi!");
    }
}

// ======= SIDEBAR =======
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const isHidden = sidebar.classList.contains('-translate-x-full');
    
    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// ======= DARK MODE =======
function toggleDark() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// ======= GUEST SYSTEM =======
function toggleGuestDropdown(e) {
    // Tıklamanın yayılmasını durdur ki document.click kapatmasın
    if(e) e.stopPropagation();
    guestDropdown.classList.toggle("hidden");
}

function changeGuest(type, delta) {
    if (type === 'adult') {
        adults = Math.max(1, adults + delta); // En az 1 yetişkin
        adultCountText.innerText = adults;
    } else {
        children = Math.max(0, children + delta);
        childCountText.innerText = children;
    }
    guestSummary.innerText = `${adults} Adults, ${children} Children`;
}

// Dışarı tıklandığında dropdown kapatma
document.addEventListener("click", function(e) {
    if (!guestDropdown.contains(e.target) && !e.target.closest('[onclick="toggleGuestDropdown()"]')) {
        guestDropdown.classList.add("hidden");
    }
});

// ======= PAYMENT SYSTEM =======
function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(value || 0);
}

function updateMoney() {
    // Sadece sayıları al (nokta ve virgül karmaşasını önlemek için)
    const total = parseFloat(totalPaymentInput.value) || 0;
    const received = parseFloat(receivedPaymentInput.value) || 0;
    const remaining = total - received;
    
    remainingPaymentInput.value = formatCurrency(remaining);
    
    // Renk Yönetimi (Modern tasarım sınıfları)
    if (remaining > 0) {
        remainingPaymentInput.classList.remove('text-emerald-500');
        remainingPaymentInput.classList.add('text-rose-500');
    } else if (total > 0 && remaining <= 0) {
        remainingPaymentInput.classList.remove('text-rose-500');
        remainingPaymentInput.classList.add('text-emerald-500');
    } else {
        remainingPaymentInput.classList.remove('text-rose-500', 'text-emerald-500');
    }
}

// ======= ACTIONS =======
function sendWhatsApp() {
    const phone = guestPhoneInput.value.replace(/\D/g,'');
    if (!phone) {
        alert("Please enter a phone number!");
        return;
    }
    
    const text = `*New Reservation*\n` +
                 `Guest: ${guestNameInput.value} ${guestSurnameInput.value}\n` +
                 `Stay: ${document.getElementById('dateRange').value}\n` +
                 `People: ${guestSummary.innerText}\n` +
                 `Total: ${formatCurrency(parseFloat(totalPaymentInput.value))}`;

    const url = `https://wa.me/90${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
}

function saveReservation() {
    const data = {
        name: guestNameInput.value,
        surname: guestSurnameInput.value,
        phone: guestPhoneInput.value,
        dates: document.getElementById('dateRange').value,
        room: document.getElementById('roomType').value,
        guests: { adults, children },
        payment: {
            total: totalPaymentInput.value,
            received: receivedPaymentInput.value,
            remaining: remainingPaymentInput.value
        }
    };

    if(!data.name || !data.dates) {
        alert("Please fill in the guest name and dates!");
        return;
    }

    console.log("Data to Save:", data);
    alert("Reservation successfully saved!");
}

function copyGuest() {
    const info = `Guest: ${guestNameInput.value} ${guestSurnameInput.value}\nPhone: ${guestPhoneInput.value}`;
    navigator.clipboard.writeText(info);
    alert("Guest info copied to clipboard!");
}