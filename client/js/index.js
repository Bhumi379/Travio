console.log("index.js is loaded");


// Import all modules
import { setNotificationCheckInterval } from './config.js';
import { getCurrentPage } from './utils.js';
import { fetchCurrentUser, logout } from './auth.js';
import { setupSearchAutocomplete } from './autocomplete.js';
import { openChat, requestRide, searchRides } from './rides.js';
import { 
  loadNotifications, 
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

// Make functions available globally (for onclick handlers in HTML)
window.logout = logout;
window.openChat = openChat;
window.requestRide = requestRide;
window.searchRides = searchRides;
window.closeNotificationPanel = closeNotificationPanel;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;

/* ==============================
   MAIN INITIALIZATION
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Application Starting...");
  
  // Fetch current user first
  await fetchCurrentUser();
  
  // Load notifications initially
  loadNotifications();
  
  // Check for new notifications every 5 seconds
  const interval = setInterval(loadNotifications, 5000);
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
    
    // Select the checkbox and the section to toggle
    const immediateStartCheckbox = document.getElementById('immediateStart');
    const driverDetailsSection = document.getElementById('driverDetailsSection');

    // Only run if these elements exist on the current page
    if (immediateStartCheckbox && driverDetailsSection) {
        
        immediateStartCheckbox.addEventListener('change', function() {
            // Select the inputs inside the driver section
            const driverNameInput = document.getElementById('driverName');
            const carNumberInput = document.getElementById('carNumber');
            const aadharInput = document.getElementById('aadharPhoto');

            if (this.checked) {
                // Show the section
                driverDetailsSection.style.display = 'block';
                
                // Make inputs required (so user can't submit empty fields if they chose this option)
                if(driverNameInput) driverNameInput.required = true;
                if(carNumberInput) carNumberInput.required = true;
                if(aadharInput) aadharInput.required = true;
                
            } else {
                // Hide the section
                driverDetailsSection.style.display = 'none';
                
                // Remove required attribute (so user CAN submit the form without these fields)
                if(driverNameInput) driverNameInput.required = false;
                if(carNumberInput) carNumberInput.required = false;
                if(aadharInput) aadharInput.required = false;
            }
        });
    }
});
