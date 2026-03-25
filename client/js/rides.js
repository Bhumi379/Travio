// Ride Management Functions
import { API_BASE, setRides, rides } from './config.js';
import { showError, showSuccess } from './utils.js';
import { loadNotifications } from './notifications.js';

function isCurrentOrFutureRide(ride) {
  const rideDate = new Date(ride.departureTime || ride.createdAt);
  if (Number.isNaN(rideDate.getTime())) return true;
  return rideDate >= new Date();
}

function isTodayRide(ride) {
  const rideDate = new Date(ride.departureTime || ride.createdAt);
  if (Number.isNaN(rideDate.getTime())) return false;
  const today = new Date();
  return rideDate.getFullYear() === today.getFullYear() &&
         rideDate.getMonth() === today.getMonth() &&
         rideDate.getDate() === today.getDate();
}

/* ==============================
   LOAD ALL RIDES (Home Page)
   - Today only
================================ */
export async function loadRides(search = "") {
  try {
    const url = new URL(`${API_BASE}/rides`);
    if (search) url.searchParams.append("search", search);

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const visibleRides = (Array.isArray(data.data) ? data.data : []).filter(isTodayRide);
    setRides(visibleRides);
    await displayRides(visibleRides, "ridesGrid");
  } catch (err) {
    showError(err.message);
  }
}

/* ==============================
   LOAD USER'S PREVIOUS RIDES
================================ */
export async function loadPreviousRides() {
  try {
    const res = await fetch(`${API_BASE}/rides/my-rides`, { 
      credentials: "include" 
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const myRides = data.data;
    await displayRides(myRides, "previousRidesGrid");
  } catch (err) {
    showError(err.message);
  }
}

/* ==============================
   LOAD RIDES FOR PROFILE PAGE
================================ */
export async function loadProfileRides() {
  try {
    const res = await fetch(`${API_BASE}/rides/my-rides`, {
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const allRides = Array.isArray(data.data) ? data.data : [];
    const now = new Date();

    const currentRides = allRides.filter((ride) => {
      const rideTime = new Date(ride.departureTime || ride.createdAt);
      return rideTime >= now;
    });

    const previousRides = allRides.filter((ride) => {
      const rideTime = new Date(ride.departureTime || ride.createdAt);
      return rideTime < now;
    });

    displayProfileRides(currentRides, "profileCurrentRidesGrid");
    displayProfileRides(previousRides, "profilePreviousRidesGrid");
  } catch (err) {
    showError(err.message);
  }
}

/* ==============================
   DISPLAY RIDES
================================ */
export function displayRides(ridesData, containerId) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error("❌ Container not found:", containerId);
    return;
  }

  if (!ridesData || !ridesData.length) {
    container.innerHTML = `
      <p style="text-align:center;color:#6b7280;padding:40px;">
        No rides found
      </p>`;
    return;
  }

  container.innerHTML = ridesData.map(ride => {
    // ✅ Build price HTML safely (NO nested template strings)
    let priceHTML = "";

if (ride.rideType?.toLowerCase() === "cab") {
  priceHTML = `
    <div class="price">
      ${ride.fare != null ? `₹${ride.fare} (Total)` : "₹TBD"}
    </div>
  `;
}

    return `
      <div class="ride-card" onclick="openRideDetails('${ride._id}')">
        <div class="ride-header">
          <div class="avatar">${ride.initiatorName?.charAt(0) || "?"}</div>
          <div class="ride-info">
            <h3>
              ${new Date(ride.departureTime || ride.createdAt).toLocaleDateString()} • 
              ${new Date(ride.departureTime || ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h3>
            <p>${ride.rideType === "cab" ? "🚖 Cab Ride" : "🤝 Travel Buddy"}</p>
          </div>
        </div>

        <div class="route">
          ${ride.pickup?.name || "Pickup"} → ${ride.destination?.name || "Destination"}
        </div>

        <div class="description">
          ${ride.notes || "No additional notes"}
        </div>

        <div class="ride-footer">
          <div class="seats">👥 ${ride.seats ?? "N/A"} seats</div>
          ${priceHTML}
        </div>

        <div class="ride-actions">
          <button class="btn btn-secondary" onclick="event.stopPropagation(); openChat('${ride._id}')">Chat</button>
          <button class="btn btn-primary" onclick="event.stopPropagation(); requestRide('${ride._id}')">Request</button>
        </div>
      </div>
    `;
  }).join("");
}

/* ==============================
   SEARCH RIDES (Home Page)
================================ */
export function searchRides() {
  const pickup = document.getElementById("pickupSearch")?.value.trim();
  const destination = document.getElementById("destinationSearch")?.value.trim();
  const date = document.getElementById("dateSearch")?.value;

  const params = new URLSearchParams();
  if (pickup) params.append("pickup", pickup);
  if (destination) params.append("destination", destination);
  if (date) params.append("date", date);

  if (date) {
    window.location.href = `search-results.html?${params.toString()}`;
    return;
  }

  loadRidesWithParams(params.toString());
}

/* ==============================
   SEARCH RESULTS PAGE
================================ */
export async function loadSearchResults() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const pickup = urlParams.get('pickup');
    const destination = urlParams.get('destination');
    const date = urlParams.get('date');

    const pickupInput = document.getElementById('pickupSearch');
    const destinationInput = document.getElementById('destinationSearch');
    const dateInput = document.getElementById('dateSearch');
    if (pickupInput && pickup !== null) pickupInput.value = pickup;
    if (destinationInput && destination !== null) destinationInput.value = destination;
    if (dateInput && date !== null) dateInput.value = date;

    const summaryEl = document.getElementById('searchSummary');
    if (summaryEl) {
      let txt = 'Showing rides';
      if (date) txt += ` for ${new Date(date).toLocaleDateString()}`;
      if (pickup) txt += ` from ${pickup}`;
      if (destination) txt += ` to ${destination}`;
      summaryEl.textContent = txt;
    }

    const query = new URLSearchParams();
    if (pickup) query.set('pickup', pickup);
    if (destination) query.set('destination', destination);
    if (date) query.set('date', date);

    const apiUrl = `${API_BASE}/rides${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(apiUrl, { credentials: 'include' });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to load search results');

    const results = Array.isArray(data.data) ? data.data : [];
    await displayRides(results, 'searchResultsGrid');

    const searchForm = document.getElementById('searchResultsForm');
    if (searchForm && !searchForm.dataset.bound) {
      searchForm.dataset.bound = 'true';
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        searchRides();
      });
    }
  } catch (err) {
    showError(err.message);
    const summaryEl = document.getElementById('searchSummary');
    if (summaryEl) summaryEl.textContent = 'Error loading search results';
  }
}

async function loadRidesWithParams(queryString = "") {
  try {
    const url = `${API_BASE}/rides${queryString ? "?" + queryString : ""}`;

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const visibleRides = (Array.isArray(data.data) ? data.data : []).filter(isCurrentOrFutureRide);
    await displayRides(visibleRides, "ridesGrid");
  } catch (err) {
    showError(err.message);
  }
}

/* ==============================
   CREATE RIDE (Create Ride Page)
================================ */
export async function createRide(data) {
  try {
    const res = await fetch(`${API_BASE}/rides/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.errors?.join(", ") || result.message);
    }

    showSuccess("Ride created successfully!");
    
    // Reset form and selections
    const form = document.getElementById("createRideForm");
    if (form) form.reset();
    
    const { setSelectedPickup, setSelectedDestination } = await import('./config.js');
    setSelectedPickup(null);
    setSelectedDestination(null);

    // Redirect to home page after short delay
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    showError(err.message);
  }
}

/* ==============================
   RIDE ACTIONS
================================ */
export function openChat(rideId) {
  window.location.href = `chat.html?rideId=${encodeURIComponent(rideId)}`;
}

export async function requestRide(rideId) {
  try {
    const res = await fetch(`${API_BASE}/ride-requests/${rideId}/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message: "I would like to join this ride"
      })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    showSuccess("Request sent successfully!");
    // Reload rides to update button state
    await loadRides();
    // Reload notifications to show new notification for ride creator
    loadNotifications();
  } catch (err) {
    showError(err.message);
  }
}

// Navigate to ride details page
export function openRideDetails(rideId) {
  if (!rideId) return;
  window.location.href = `ride_details.html?rideId=${encodeURIComponent(rideId)}`;
}

function displayProfileRides(ridesData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!ridesData || !ridesData.length) {
    container.innerHTML = `
      <p style="text-align:center;color:#6b7280;padding:40px;">
        No rides found
      </p>`;
    return;
  }

  container.innerHTML = ridesData
    .map((ride) => {
      const isCab = ride.rideType?.toLowerCase() === "cab";
      const roleLabel =
        ride.role === "creator" ? "You created this ride" : "You joined this ride";

      return `
      <div class="ride-card" onclick="openRideDetails('${ride._id}')">
        <div class="ride-header">
          <div class="avatar">${ride.initiatorName?.charAt(0) || "?"}</div>
          <div class="ride-info">
            <h3>
              ${new Date(ride.departureTime || ride.createdAt).toLocaleDateString()} • 
              ${new Date(ride.departureTime || ride.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </h3>
            <p>${isCab ? "🚖 Cab Ride" : "🤝 Travel Buddy"} • ${roleLabel}</p>
          </div>
        </div>

        <div class="route">
          ${ride.pickup?.name || "Pickup"} → ${ride.destination?.name || "Destination"}
        </div>

        <div class="description">
          ${ride.notes || "No additional notes"}
        </div>

        <div class="ride-footer">
          <div class="seats">👥 ${ride.seats ?? "N/A"} seats</div>
          ${
            isCab
              ? `<div class="price">${ride.fare != null ? `₹${ride.fare} (Total)` : "₹TBD"}</div>`
              : ""
          }
        </div>

        <div class="ride-actions">
          <button class="btn btn-secondary" onclick="event.stopPropagation(); openChat('${ride._id}')">Chat</button>
          <button class="btn btn-primary" onclick="event.stopPropagation(); openRideDetails('${ride._id}')">View</button>
        </div>
      </div>
    `;
    })
    .join("");
}
