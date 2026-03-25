console.log("index.js is loaded");


// Import all modules
import { setNotificationCheckInterval } from './config.js';
import { getCurrentPage } from './utils.js';
import { fetchCurrentUser, logout } from './auth.js';
import { setupSearchAutocomplete } from './autocomplete.js';
import { openChat, requestRide, searchRides, openRideDetails } from './rides.js';
import { 
  loadNotifications, 
  loadChatUnreadCount,
  closeNotificationPanel,
  acceptRequest,
  rejectRequest 
} from './notifications.js';
import { 
  initHomePage, 
  initCreateRidePage, 
  initPreviousRidesPage, 
  initProfilePage 
} from './pageInit.js';
import { submitReview } from './reviews.js';

// Make functions available globally (for onclick handlers in HTML)
window.logout = logout;
window.openChat = openChat;
window.requestRide = requestRide;
window.searchRides = searchRides;
window.openRideDetails = openRideDetails;
window.closeNotificationPanel = closeNotificationPanel;
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
  
  // Load notification + chat unread counters initially
  loadNotifications();
  loadChatUnreadCount();
  
  // Check for new notifications/messages every 5 seconds
  const interval = setInterval(() => {
    loadNotifications();
    loadChatUnreadCount();
  }, 5000);
  setNotificationCheckInterval(interval);
  
  // Initialize based on current page
  const currentPage = getCurrentPage();
  console.log("📄 Current Page:", currentPage);
  
  switch(currentPage) {
    case 'home':
      initHomePage();
      break;
    case 'create_ride':
      initCreateRidePage();
      break;
    case 'previous':
      initPreviousRidesPage();
      break;
    case 'profile':
      initProfilePage();
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

    // Only run if these elements exist on the current page
    if (rideTypeCab && rideTypeTravelBuddy && driverDetailsSection) {
        const toggleDriverSection = () => {
            // Select the inputs inside the driver section
            const driverNameInput = document.getElementById('driverName');
            const carNumberInput = document.getElementById('carNumber');
            const aadharInput = document.getElementById('aadharPhoto');

            if (rideTypeCab.checked) {
                // Show the section
                driverDetailsSection.style.display = 'block';
                
                // Make inputs required when cab sharing is selected
                if(driverNameInput) driverNameInput.required = true;
                if(carNumberInput) carNumberInput.required = true;
                if(aadharInput) aadharInput.required = true;
                
            } else {
                // Hide the section
                driverDetailsSection.style.display = 'none';
                
                // Remove required attributes for travel buddy posts
                if(driverNameInput) driverNameInput.required = false;
                if(carNumberInput) carNumberInput.required = false;
                if(aadharInput) aadharInput.required = false;
            }
        };

        rideTypeCab.addEventListener('change', toggleDriverSection);
        rideTypeTravelBuddy.addEventListener('change', toggleDriverSection);
        toggleDriverSection();
    }
});
