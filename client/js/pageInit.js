// Page-Specific Initialization Functions
import { currentUser, setSelectedPickup, setSelectedDestination } from './config.js';
import { fetchCurrentUser, updateCurrentUserProfile } from './auth.js';
import { loadRides, loadPreviousRides, createRide, loadProfileRides, loadSearchResults, consumeCreateRidePrefill } from './rides.js';
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
  let isSubmitting = false;

  const prefill = consumeCreateRidePrefill();
  if (prefill) {
    const pickupEl = document.getElementById("pickup");
    const destEl = document.getElementById("destination");
    const dateEl = document.getElementById("rideDate");

    if (prefill.pickupGeo && pickupEl) {
      const g = prefill.pickupGeo;
      pickupEl.value = g.displayName || g.name || prefill.pickupText || "";
      localSelectedPickup = {
        name: g.name,
        address: g.displayName || g.name,
        location: {
          type: "Point",
          coordinates: [g.lng, g.lat],
        },
      };
      setSelectedPickup(localSelectedPickup);
    } else if (prefill.pickupText && pickupEl) {
      pickupEl.value = prefill.pickupText;
    }

    if (prefill.destGeo && destEl) {
      const g = prefill.destGeo;
      destEl.value = g.displayName || g.name || prefill.destinationText || "";
      localSelectedDestination = {
        name: g.name,
        address: g.displayName || g.name,
        location: {
          type: "Point",
          coordinates: [g.lng, g.lat],
        },
      };
      setSelectedDestination(localSelectedDestination);
    } else if (prefill.destinationText && destEl) {
      destEl.value = prefill.destinationText;
    }

    if (prefill.date && dateEl) {
      dateEl.value = prefill.date;
    }
  }
  
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
      if (isSubmitting) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      isSubmitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing...";
      }
      try {

      const pickupInput = document.getElementById("pickup");
      const destinationInput = document.getElementById("destination");
      const date = document.getElementById("rideDate").value;
      const time = document.getElementById("rideTime").value;
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

      const ridePostType = document.querySelector('input[name="ridePostType"]:checked')?.value;
      const rideType = ridePostType === "cab" ? "cab" : "travelBuddy";

      const rideData = {
        pickup: localSelectedPickup,
        destination: localSelectedDestination,
        rideType,
        departureTime,
        notes: notes || undefined,
      };

      if (rideType === "cab") {
        const seats = document.getElementById("seats")?.value || 1;
        const fare = document.getElementById("fare")?.value;
        rideData.seats = parseInt(seats, 10);
        rideData.fare = fare ? parseFloat(fare) : undefined;
      }

      let payload;
      if (rideType === "cab") {
        const driverNameInput = document.getElementById("driverName");
        const carNumberInput = document.getElementById("carNumber");
        const aadharFile = document.getElementById("aadharPhoto")?.files?.[0];
        const licenseFile = document.getElementById("licensePhoto")?.files?.[0];

        const driverName = driverNameInput?.value?.trim();
        const carNumber = carNumberInput?.value?.trim();

        const driver = {
          name: driverName || undefined,
          vehicleNumber: carNumber || undefined,
        };

        const hasFiles = !!(aadharFile || licenseFile);

        if (hasFiles) {
          const formData = new FormData();
          formData.append("pickup", JSON.stringify(rideData.pickup));
          formData.append("destination", JSON.stringify(rideData.destination));
          formData.append("rideType", rideData.rideType);
          formData.append("departureTime", rideData.departureTime);
          if (rideData.seats != null && !Number.isNaN(rideData.seats)) {
            formData.append("seats", String(rideData.seats));
          }
          if (rideData.fare != null && !Number.isNaN(rideData.fare)) {
            formData.append("fare", String(rideData.fare));
          }
          if (rideData.notes) formData.append("notes", rideData.notes);
          formData.append("driver", JSON.stringify(driver));
          if (aadharFile) formData.append("aadhar", aadharFile);
          if (licenseFile) formData.append("license", licenseFile);
          payload = formData;
        } else {
          rideData.driver =
            driver.name || driver.vehicleNumber ? driver : null;
          payload = rideData;
        }
      } else {
        payload = rideData;
      }

      await createRide(payload);
      } finally {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "🎉 Publish Ride";
        }
      }
    });
  }
}

export function initPreviousRidesPage() {
  console.log("📜 Initializing Previous Rides Page");
  loadPreviousRides();
}

export async function initProfilePage() {
  console.log("👤 Initializing Profile Page");
  // Profile form is already populated by fetchCurrentUser()
  await loadProfileRides();

  // Load profile pictures
  loadProfilePictures();
  
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById("fullName")?.value?.trim();
        const email = document.getElementById("email")?.value?.trim();
        const contactNumber = document.getElementById("phone")?.value?.trim();
        const guardianNumber = document.getElementById("guardianPhone")?.value?.trim();
        const password = document.getElementById("password")?.value || "";
        const profilePicture = document.getElementById("selectedProfilePicture")?.value || "";

        console.log("📤 Sending profile update with picture:", profilePicture);
        
        await updateCurrentUserProfile({
          name,
          email,
          contactNumber,
          guardianNumber,
          password: password.trim() ? password : undefined,
          profilePicture: profilePicture || "",
        });

        const avatarDiv = document.querySelector(".profile-avatar");
        if (avatarDiv) {
          // If profile picture is set, show it; else show initial
          if (profilePicture) {
            avatarDiv.style.backgroundImage = `url('${profilePicture}')`;
            avatarDiv.style.backgroundSize = 'cover';
            avatarDiv.style.backgroundPosition = 'center';
            avatarDiv.textContent = '';
          } else {
            avatarDiv.style.backgroundImage = '';
            avatarDiv.textContent = name?.charAt(0)?.toUpperCase() || "U";
          }
        }
        const displayName = document.getElementById("profileDisplayName");
        if (displayName) {
          displayName.textContent = name || "Welcome to my Profile";
        }

        const passwordInput = document.getElementById("password");
        if (passwordInput) passwordInput.value = "";

        alert("Profile updated successfully!");
      } catch (err) {
        alert(err.message || "Failed to update profile");
      }
    });
  }
}

export function initSearchResultsPage() {
  console.log("🔎 Initializing Search Results Page");
  loadSearchResults();
}

async function loadProfilePictures() {
  try {
    // Try multiple paths to find the JSON file
    let res = await fetch('/images/profile-pictures-mapping.json');
    
    if (!res.ok) {
      console.warn("Failed to load from /images, trying ./images");
      res = await fetch('./images/profile-pictures-mapping.json');
    }
    
    if (!res.ok) {
      console.warn("Failed to load from ./images, trying ../images");
      res = await fetch('../images/profile-pictures-mapping.json');
    }
    
    if (!res.ok) {
      throw new Error(`Failed to load profile pictures: ${res.status} ${res.statusText}`);
    }
    
    const pictures = await res.json();
    console.log("✅ Profile pictures loaded:", Object.keys(pictures).length);
    
    const grid = document.getElementById('profilePicturesGrid');
    if (!grid) {
      console.error("❌ Grid element not found");
      return;
    }
    
    // Get the current user's profile picture
    const { currentUser } = await import('./config.js');
    const savedPicture = currentUser?.profilePicture;
    console.log("💾 Currently saved picture:", savedPicture);
    
    for (const [key, url] of Object.entries(pictures)) {
      const picDiv = document.createElement('div');
      picDiv.className = 'profile-pic-option';
      picDiv.innerHTML = `<img src="${url}" alt="Profile Picture" loading="lazy">`;
      
      // Test if image loads
      const img = picDiv.querySelector('img');
      img.addEventListener('error', () => {
        console.error("❌ Image failed to load:", url);
      });
      img.addEventListener('load', () => {
        console.log("✅ Image loaded:", url);
      });
      
      // If this is the saved picture, select it
      if (savedPicture && url === savedPicture) {
        picDiv.classList.add('selected');
        document.getElementById('selectedProfilePicture').value = url;
        console.log("🎯 Auto-selected saved picture:", url);
      }
      
      picDiv.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.profile-pic-option').forEach(el => {
          el.classList.remove('selected');
        });
        // Add selected to this one
        picDiv.classList.add('selected');
        // Store the URL
        document.getElementById('selectedProfilePicture').value = url;
        console.log("Selected profile picture:", url);
      });
      
      grid.appendChild(picDiv);
    }
  } catch (err) {
    console.error("❌ Error loading profile pictures:", err);
  }
}
