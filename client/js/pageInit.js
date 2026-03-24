// Page-Specific Initialization Functions
import { currentUser, setSelectedPickup, setSelectedDestination } from './config.js';
import { fetchCurrentUser } from './auth.js';
import { loadRides, loadPreviousRides, createRide, loadProfileRides } from './rides.js';
import { setupOSMAutocomplete, setupSearchAutocomplete } from './autocomplete.js';
import { searchRides } from './rides.js';
import { showError } from './utils.js';
import { initReviewSection } from './reviews.js';

export async function initHomePage() {
  console.log("🏠 Initializing Home Page");
  // Ensure user is loaded before loading rides
  if (!currentUser) {
    await fetchCurrentUser();
  }
  await loadRides();
  
  // Setup search bar autocomplete
  setupSearchAutocomplete("pickupSearch");
  setupSearchAutocomplete("destinationSearch");
  
  // Setup search button
  const searchBtn = document.querySelector('button[onclick="searchRides()"]');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchRides);
  }

  initReviewSection();
}

export function initCreateRidePage() {
  console.log("➕ Initializing Create Ride Page");
  
  let localSelectedPickup = null;
  let localSelectedDestination = null;
  
  // Setup create ride form autocomplete
  setupOSMAutocomplete("pickup", place => {
    localSelectedPickup = {
      name: place.name,
      address: place.address,
      location: {
        type: "Point",
        coordinates: [place.longitude, place.latitude]
      }
    };
    setSelectedPickup(localSelectedPickup);
    console.log("📍 Pickup selected:", localSelectedPickup);
  });

  setupOSMAutocomplete("destination", place => {
    localSelectedDestination = {
      name: place.name,
      address: place.address,
      location: {
        type: "Point",
        coordinates: [place.longitude, place.latitude]
      }
    };
    setSelectedDestination(localSelectedDestination);
    console.log("🏁 Destination selected:", localSelectedDestination);
  });

  // Setup form submission
  const form = document.getElementById("createRideForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const pickupInput = document.getElementById("pickup");
      const destinationInput = document.getElementById("destination");
      const date = document.getElementById("rideDate").value;
      const time = document.getElementById("rideTime").value;
      const seats = document.getElementById("seats")?.value || 1;
      const fare = document.getElementById("fare")?.value;
      const notes = document.getElementById("notes")?.value;

      // Basic empty checks first
      if (!pickupInput?.value.trim() || !destinationInput?.value.trim()) {
        showError("Please enter pickup and destination");
        return;
      }

      // Fallback: if user typed manually and didn't click a suggestion,
      // still build a minimal place object so the ride can be created.
      if (!localSelectedPickup) {
        const name = pickupInput.value.trim();
        localSelectedPickup = {
          name,
          address: name,
          location: {
            type: "Point",
            // Fallback coordinates (0,0) – backend requires a point
            coordinates: [0, 0],
          },
        };
        setSelectedPickup(localSelectedPickup);
      }

      if (!localSelectedDestination) {
        const name = destinationInput.value.trim();
        localSelectedDestination = {
          name,
          address: name,
          location: {
            type: "Point",
            coordinates: [0, 0],
          },
        };
        setSelectedDestination(localSelectedDestination);
      }

      if (!date || !time) {
        showError("Please select date and time");
        return;
      }

      const departureTime = new Date(`${date}T${time}:00`).toISOString();

      const isTravelBuddy = document.getElementById("buddyRequest")?.checked;
      const rideType = isTravelBuddy ? "travelBuddy" : "cab";

      const rideData = {
        pickup: localSelectedPickup,
        destination: localSelectedDestination,
        rideType,
        departureTime,
        seats: parseInt(seats),
        fare: fare ? parseFloat(fare) : undefined,
        notes: notes || undefined,
      };

      // For cab rides, include minimal driver details so backend validation passes
      if (rideType === "cab") {
        const driverNameInput = document.getElementById("driverName");
        const carNumberInput = document.getElementById("carNumber");

        const driverName = driverNameInput?.value?.trim();
        const carNumber = carNumberInput?.value?.trim();

        rideData.driver = {
          name: driverName || undefined,
          vehicleNumber: carNumber || undefined,
        };
      }

      await createRide(rideData);
    });
  }
}

export function initPreviousRidesPage() {
  console.log("📜 Initializing Previous Rides Page");
  loadPreviousRides();
}

export function initProfilePage() {
  console.log("👤 Initializing Profile Page");
  // Profile form is already populated by fetchCurrentUser()
  loadProfileRides();
  
  // You can add profile update functionality here
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Implement profile update logic
      alert("Profile update functionality coming soon!");
    });
  }
}
