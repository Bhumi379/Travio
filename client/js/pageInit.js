// Page-Specific Initialization Functions
import { currentUser, setSelectedPickup, setSelectedDestination } from './config.js';
import { fetchCurrentUser } from './auth.js';
import { loadRides, loadPreviousRides, createRide } from './rides.js';
import { setupOSMAutocomplete, setupSearchAutocomplete } from './autocomplete.js';
import { searchRides } from './rides.js';
import { showError } from './utils.js';

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

      if (!localSelectedPickup || !localSelectedDestination) {
        showError("Please select pickup and destination from suggestions");
        return;
      }

      const date = document.getElementById("rideDate").value;
      const time = document.getElementById("rideTime").value;
      const seats = document.getElementById("seats")?.value || 1;
      const fare = document.getElementById("fare")?.value;
      const notes = document.getElementById("notes")?.value;

      if (!date || !time) {
        showError("Please select date and time");
        return;
      }

      const departureTime = new Date(`${date}T${time}:00`).toISOString();

      const rideData = {
        pickup: localSelectedPickup,
        destination: localSelectedDestination,
        rideType: document.getElementById("buddyRequest")?.checked
          ? "travelBuddy"
          : "cab",
        departureTime,
        seats: parseInt(seats),
        fare: fare ? parseFloat(fare) : undefined,
        notes: notes || undefined
      };

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
