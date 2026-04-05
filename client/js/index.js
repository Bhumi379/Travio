console.log("index.js is loaded");


// Import all modules
import { setNotificationCheckInterval } from './config.js';
import { getCurrentPage } from './utils.js';
import { fetchCurrentUser, logout } from './auth.js';
import { setupSearchAutocomplete } from './autocomplete.js';
import {
  openChat,
  requestRide,
  searchRides,
  openRideDetails,
  applySearchResultFilters,
  clearSearchResultFilters,
} from './rides.js';
import { 
  loadNotifications, 
  loadChatUnreadCount,
  closeNotificationPanel,
  closeChatPanel,
  toggleNotificationPanel,
  toggleChatPanel,
  acceptRequest,
  rejectRequest 
} from './notifications.js';
import * as pageInit from './pageInit.js';
import { submitReview } from './reviews.js';

// Make functions available globally (for onclick handlers in HTML)
window.logout = logout;
window.openChat = openChat;
window.requestRide = requestRide;
window.searchRides = searchRides;
window.applySearchResultFilters = applySearchResultFilters;
window.clearSearchResultFilters = clearSearchResultFilters;
window.openRideDetails = openRideDetails;
window.closeNotificationPanel = closeNotificationPanel;
window.closeChatPanel = closeChatPanel;
window.toggleNotificationPanel = toggleNotificationPanel;
window.toggleChatPanel = toggleChatPanel;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.submitReview = submitReview;

/* ==============================
   MAIN INITIALIZATION
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Starting...");
  
  // Fetch current user first
  await fetchCurrentUser();
  
  const onInfoPage =
    typeof window !== 'undefined' &&
    (window.location.pathname.includes('about.html') ||
      window.location.pathname.endsWith('/about'));

  if (!onInfoPage) {
    loadNotifications();
    loadChatUnreadCount();
    const interval = setInterval(() => {
      loadNotifications();
      loadChatUnreadCount();
    }, 5000);
    setNotificationCheckInterval(interval);
  }
  
  // Initialize based on current page
  const currentPage = getCurrentPage();
  console.log("📄 Current Page:", currentPage);
  
  switch(currentPage) {
    case 'home':
      pageInit.initHomePage?.();
      break;
    case 'create_ride':
      pageInit.initCreateRidePage?.();
      break;
    case 'previous':
      pageInit.initPreviousRidesPage?.();
      break;
    case 'profile':
      await pageInit.initProfilePage?.();
      break;
    case 'search_results':
      pageInit.initSearchResultsPage?.();
      break;
    case 'about':
      break;
    default:
      console.warn("⚠️ Unknown page:", currentPage);
  }
});

// Initialize search autocomplete for home page
document.addEventListener('DOMContentLoaded', () => {
  setupSearchAutocomplete('pickupSearch');
  setupSearchAutocomplete('destinationSearch');
});

// Driver details toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Select ride type controls and toggle driver section for cab rides
    const rideTypeCab = document.getElementById('rideTypeCab');
    const rideTypeTravelBuddy = document.getElementById('rideTypeTravelBuddy');
    const driverDetailsSection = document.getElementById('driverDetailsSection');
    const seatFareSection = document.getElementById('seatFareSection');

    // Only run if these elements exist on the current page
    if (rideTypeCab && rideTypeTravelBuddy && driverDetailsSection) {
        const toggleDriverSection = () => {
            // Select the inputs inside the driver section
            const driverNameInput = document.getElementById('driverName');
            const carNumberInput = document.getElementById('carNumber');
            const aadharInput = document.getElementById('aadharPhoto');
            const licenseInput = document.getElementById('licensePhoto');
            const seatsInput = document.getElementById('seats');
            const fareInput = document.getElementById('fare');

            if (rideTypeCab.checked) {
                // Show the section
                driverDetailsSection.style.display = 'block';
                if (seatFareSection) seatFareSection.style.display = 'block';

                // Driver details are optional; seats still required for cab.
                if (driverNameInput) driverNameInput.required = false;
                if (carNumberInput) carNumberInput.required = false;
                if (seatsInput) seatsInput.required = true;
                if (aadharInput) aadharInput.required = false;
                if (licenseInput) licenseInput.required = false;
                
            } else {
                // Hide the section
                driverDetailsSection.style.display = 'none';
                if (seatFareSection) seatFareSection.style.display = 'none';
                
                // Remove required attributes for travel buddy posts
                if(driverNameInput) driverNameInput.required = false;
                if(carNumberInput) carNumberInput.required = false;
                if(aadharInput) aadharInput.required = false;
                if(licenseInput) licenseInput.required = false;
                if(seatsInput) {
                    seatsInput.required = false;
                    seatsInput.value = 1;
                }
                if(fareInput) fareInput.value = "";
            }
        };

        rideTypeCab.addEventListener('change', toggleDriverSection);
        rideTypeTravelBuddy.addEventListener('change', toggleDriverSection);
        toggleDriverSection();
    }
});

// File name previews for upload inputs on create ride page
document.addEventListener("DOMContentLoaded", () => {
  const aadharInput = document.getElementById("aadharPhoto");
  const aadharName = document.getElementById("fileName");
  if (aadharInput && aadharName) {
    aadharInput.addEventListener("change", () => {
      aadharName.textContent = aadharInput.files?.[0]?.name || "No file chosen";
    });
  }

  const licenseInput = document.getElementById("licensePhoto");
  const licenseName = document.getElementById("licenseFileName");
  if (licenseInput && licenseName) {
    licenseInput.addEventListener("change", () => {
      licenseName.textContent = licenseInput.files?.[0]?.name || "No file chosen";
    });
  }
});
