// Ride Management Functions
import { API_BASE, setRides, rides, currentUser } from './config.js';
import { showError, showSuccess } from './utils.js';
import { loadNotifications } from './notifications.js';
import { geocodePlace } from './geocode.js';

const SEARCH_RADIUS_METERS = 15000;
const PREFILL_STORAGE_KEY = 'travio_create_ride_prefill';

/** Raw API results on search-results page (client-side filters apply on top). */
let lastSearchResultsRaw = [];
let lastSearchContext = {
  pickup: '',
  destination: '',
  date: null,
  pickupGeo: null,
  destGeo: null,
};

function isSearchResultsPath() {
  return window.location.pathname.includes('search-results.html');
}

function normalizeRideTypeValue(ride) {
  const t = (ride?.rideType || '').toLowerCase().replace(/_/g, '');
  if (t === 'travelbuddy') return 'travelBuddy';
  if (t === 'cab') return 'cab';
  return ride?.rideType || '';
}

function filterRidesByTypeFilter(rides, rideTypeFilter) {
  if (!rideTypeFilter || rideTypeFilter === 'all') return rides;
  return rides.filter((ride) => {
    const n = normalizeRideTypeValue(ride);
    if (rideTypeFilter === 'cab') return n === 'cab';
    if (rideTypeFilter === 'travelBuddy') return n === 'travelBuddy';
    return true;
  });
}

function sortSearchRidesList(rides, sortKey) {
  const arr = [...rides];
  if (sortKey === 'fare') {
    return arr.sort((a, b) => {
      const cabA = normalizeRideTypeValue(a) === 'cab';
      const cabB = normalizeRideTypeValue(b) === 'cab';
      const fa = cabA && a.fare != null ? Number(a.fare) : Infinity;
      const fb = cabB && b.fare != null ? Number(b.fare) : Infinity;
      return fa - fb;
    });
  }
  return arr.sort((a, b) => {
    const ta = new Date(a.departureTime || a.createdAt).getTime();
    const tb = new Date(b.departureTime || b.createdAt).getTime();
    return ta - tb;
  });
}

function getSearchFilterState() {
  const rideType = document.getElementById('filterRideType')?.value || 'all';
  const sort = document.getElementById('filterSort')?.value || 'departure';
  return { rideType, sort };
}

function syncSearchFiltersToUrl() {
  if (!isSearchResultsPath()) return;
  const url = new URL(window.location.href);
  const { rideType, sort } = getSearchFilterState();
  if (rideType && rideType !== 'all') url.searchParams.set('rideType', rideType);
  else url.searchParams.delete('rideType');
  if (sort && sort !== 'departure') url.searchParams.set('sort', sort);
  else url.searchParams.delete('sort');
  history.replaceState({}, '', url.pathname + url.search);
}

function readSearchFiltersFromUrl(urlParams) {
  const rideType = urlParams.get('rideType') || 'all';
  const sort = urlParams.get('sort') || 'departure';
  const rtEl = document.getElementById('filterRideType');
  const stEl = document.getElementById('filterSort');
  if (rtEl && ['all', 'cab', 'travelBuddy'].includes(rideType)) rtEl.value = rideType;
  if (stEl && ['departure', 'fare'].includes(sort)) stEl.value = sort;
}

function applyClientSearchFilters(rides) {
  const { rideType, sort } = getSearchFilterState();
  let out = filterRidesByTypeFilter(rides, rideType);
  out = sortSearchRidesList(out, sort);
  return out;
}

async function renderSearchResultsGridFromCache() {
  const container = document.getElementById('searchResultsGrid');
  if (!container || !isSearchResultsPath()) return;

  syncSearchFiltersToUrl();

  const countEl = document.getElementById('searchResultsCount');
  if (!lastSearchResultsRaw.length) {
    if (countEl) countEl.textContent = '0';
    return;
  }

  const filtered = applyClientSearchFilters(lastSearchResultsRaw);
  if (countEl) countEl.textContent = String(filtered.length);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="search-filter-empty">
        <p class="search-filter-empty-title">No rides match your filters</p>
        <p class="search-filter-empty-hint">Try a different ride type or sort, or reset filters.</p>
        <button type="button" class="btn btn-primary" id="searchFilterResetInline">Reset filters</button>
      </div>`;
    document.getElementById('searchFilterResetInline')?.addEventListener('click', () => {
      clearSearchResultFilters();
    });
    return;
  }

  await displayRides(filtered, 'searchResultsGrid');
}

/** Called from filter UI (onchange) — exposed on window from index.js */
export function applySearchResultFilters() {
  renderSearchResultsGridFromCache();
}

export function clearSearchResultFilters() {
  const rt = document.getElementById('filterRideType');
  const st = document.getElementById('filterSort');
  if (rt) rt.value = 'all';
  if (st) st.value = 'departure';
  renderSearchResultsGridFromCache();
}

async function buildRideSearchQuery(pickupText, destinationText, dateStr) {
  const query = new URLSearchParams();
  if (pickupText) query.set('pickup', pickupText);
  if (destinationText) query.set('destination', destinationText);
  if (dateStr) query.set('date', dateStr);
  query.set('distance', String(SEARCH_RADIUS_METERS));

  const pickupGeo = pickupText ? await geocodePlace(pickupText) : null;
  const destGeo = destinationText ? await geocodePlace(destinationText) : null;

  if (pickupGeo && Number.isFinite(pickupGeo.lat) && Number.isFinite(pickupGeo.lng)) {
    query.set('pickupLat', String(pickupGeo.lat));
    query.set('pickupLng', String(pickupGeo.lng));
  }
  if (destGeo && Number.isFinite(destGeo.lat) && Number.isFinite(destGeo.lng)) {
    query.set('destLat', String(destGeo.lat));
    query.set('destLng', String(destGeo.lng));
  }
  return {
    query,
    pickupGeo,
    destGeo,
  };
}

function goToCreateRidePrefill({ pickupText, destinationText, date, pickupGeo, destGeo }) {
  const payload = {
    pickupText: pickupText || '',
    destinationText: destinationText || '',
    date: date || null,
    pickupGeo: pickupGeo
      ? {
          name: pickupGeo.name,
          displayName: pickupGeo.displayName,
          lat: pickupGeo.lat,
          lng: pickupGeo.lng,
        }
      : null,
    destGeo: destGeo
      ? {
          name: destGeo.name,
          displayName: destGeo.displayName,
          lat: destGeo.lat,
          lng: destGeo.lng,
        }
      : null,
  };
  try {
    sessionStorage.setItem(PREFILL_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not store create-ride prefill', e);
  }
  window.location.href = 'create_a_ride.html';
}

/** Read and clear one-shot prefill from search (create ride page). */
export function consumeCreateRidePrefill() {
  try {
    const raw = sessionStorage.getItem(PREFILL_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

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
function getRideCreatorId(ride) {
  if (!ride?.initiatorId) return null;
  if (typeof ride.initiatorId === "string") return ride.initiatorId;
  return ride.initiatorId._id || null;
}

async function getRideRequestStatusMap(ridesData) {
  const statusEntries = await Promise.all(
    ridesData.map(async (ride) => {
      try {
        const res = await fetch(`${API_BASE}/ride-requests/${ride._id}/request-status`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success || !data.hasRequest) return [ride._id, null];
        return [ride._id, data.data?.status || null];
      } catch {
        return [ride._id, null];
      }
    })
  );
  return Object.fromEntries(statusEntries);
}

function buildRequestButton(ride, requestStatus) {
  const creatorId = getRideCreatorId(ride);
  if (creatorId && currentUser?._id && String(creatorId) === String(currentUser._id)) {
    return `<button class="btn btn-request-status btn-status-own" disabled>Your Ride</button>`;
  }

  if (requestStatus === "pending") {
    return `<button class="btn btn-request-status btn-status-pending" disabled>Pending</button>`;
  }
  if (requestStatus === "accepted") {
    return `<button class="btn btn-request-status btn-status-accepted" disabled>Accepted</button>`;
  }
  if (requestStatus === "rejected") {
    return `<button class="btn btn-request-status btn-status-rejected" disabled>Rejected</button>`;
  }

  return `<button class="btn btn-primary" onclick="event.stopPropagation(); requestRide('${ride._id}')">Request</button>`;
}

export async function displayRides(ridesData, containerId) {
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

  const requestStatusMap = await getRideRequestStatusMap(ridesData);

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

    // Build avatar HTML - show profile picture if available
    let avatarHTML = "";
    if (ride.initiatorProfilePicture) {
      avatarHTML = `<div class="avatar" style="background-image: url('${ride.initiatorProfilePicture}'); background-size: cover; background-position: center;"></div>`;
    } else {
      avatarHTML = `<div class="avatar">${ride.initiatorName?.charAt(0) || "?"}</div>`;
    }

    const requestButtonHTML = buildRequestButton(ride, requestStatusMap[ride._id]);

    return `
      <div class="ride-card" onclick="openRideDetails('${ride._id}')">
        <div class="ride-header">
          ${avatarHTML}
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
          ${requestButtonHTML}
        </div>
      </div>
    `;
  }).join("");
}

/* ==============================
   SEARCH RIDES (Home Page)
================================ */
export async function searchRides() {
  const pickup = document.getElementById("pickupSearch")?.value.trim() ?? "";
  const destination = document.getElementById("destinationSearch")?.value.trim() ?? "";
  const date = document.getElementById("dateSearch")?.value ?? "";

  const params = new URLSearchParams();
  if (pickup) params.append("pickup", pickup);
  if (destination) params.append("destination", destination);
  if (date) params.append("date", date);

  const path = window.location.pathname;
  const isHome = path.endsWith("index.html") || path === "/" || path.endsWith("/");

  if (path.includes("search-results.html")) {
    window.location.href = `search-results.html?${params.toString()}`;
    return;
  }

  if (isHome) {
    if (date) {
      window.location.href = `search-results.html?${params.toString()}`;
      return;
    }
    await loadRidesWithParams(pickup, destination, date);
    return;
  }

  window.location.href = `search-results.html?${params.toString()}`;
}

/* ==============================
   SEARCH RESULTS PAGE
================================ */
export async function loadSearchResults() {
  try {
    const summaryElPre = document.getElementById('searchSummary');
    if (summaryElPre) summaryElPre.textContent = 'Loading rides…';
    const countPre = document.getElementById('searchResultsCount');
    if (countPre) countPre.textContent = '—';

    const urlParams = new URLSearchParams(window.location.search);
    const pickup = urlParams.get('pickup');
    const destination = urlParams.get('destination');
    const date = urlParams.get('date');

    const pickupInput = document.getElementById('pickupSearch');
    const destinationInput = document.getElementById('destinationSearch');
    const dateInput = document.getElementById('dateSearch');
    if (pickupInput && pickup !== null) pickupInput.value = pickup || '';
    if (destinationInput && destination !== null) destinationInput.value = destination || '';
    if (dateInput && date !== null) dateInput.value = date || '';

    readSearchFiltersFromUrl(urlParams);

    const summaryEl = document.getElementById('searchSummary');
    if (summaryEl) {
      let txt = 'Rides matching your search (within about 15 km when places geocode)';
      if (date) txt += ` · ${new Date(date).toLocaleDateString()}`;
      if (pickup) txt += ` · From ${pickup}`;
      if (destination) txt += ` · To ${destination}`;
      summaryEl.textContent = txt;
    }

    const { query, pickupGeo, destGeo } = await buildRideSearchQuery(
      pickup || '',
      destination || '',
      date || ''
    );
    lastSearchContext = {
      pickup: pickup || '',
      destination: destination || '',
      date: date || null,
      pickupGeo,
      destGeo,
    };

    const apiUrl = `${API_BASE}/rides${query.toString() ? '?' + query.toString() : ''}`;
    const res = await fetch(apiUrl, { credentials: 'include' });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to load search results');

    let results = Array.isArray(data.data) ? data.data : [];
    results = results.filter(isCurrentOrFutureRide);
    lastSearchResultsRaw = results;

    const container = document.getElementById('searchResultsGrid');
    const countEl = document.getElementById('searchResultsCount');
    if (countEl) countEl.textContent = String(results.length);

    if (!results.length && container) {
      lastSearchResultsRaw = [];
      container.innerHTML = `
        <div class="search-empty-state">
          <p class="search-empty-title">No rides found for this search</p>
          <p class="search-empty-hint">
            Post this trip so others can join. We'll pre-fill pickup, destination${date ? ', and date' : ''} from your search.
          </p>
          <button type="button" class="btn btn-primary" id="createRideFromSearchBtn">Create a ride with these details</button>
        </div>`;
      document.getElementById('createRideFromSearchBtn')?.addEventListener('click', () => {
        goToCreateRidePrefill({
          pickupText: pickup || '',
          destinationText: destination || '',
          date: date || null,
          pickupGeo,
          destGeo,
        });
      });
    } else {
      await renderSearchResultsGridFromCache();
    }
  } catch (err) {
    showError(err.message);
    const summaryEl = document.getElementById('searchSummary');
    if (summaryEl) summaryEl.textContent = 'Error loading search results';
    lastSearchResultsRaw = [];
  }
}

async function loadRidesWithParams(pickupText, destinationText, dateStr) {
  try {
    const { query } = await buildRideSearchQuery(
      pickupText || '',
      destinationText || '',
      dateStr || ''
    );
    const url = `${API_BASE}/rides${query.toString() ? '?' + query.toString() : ''}`;

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
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE}/rides/create`, {
      method: "POST",
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(
        result.errors?.join(", ") ||
        result.error ||
        result.message ||
        "Failed to create ride"
      );
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
    // Reload cards to reflect request status
    if (window.location.pathname.includes("search-results.html")) {
      await loadSearchResults();
    } else {
      await loadRides();
    }
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

      // Build avatar HTML - show profile picture if available
      let avatarHTML = "";
      if (ride.initiatorProfilePicture) {
        avatarHTML = `<div class="avatar" style="background-image: url('${ride.initiatorProfilePicture}'); background-size: cover; background-position: center;"></div>`;
      } else {
        avatarHTML = `<div class="avatar">${ride.initiatorName?.charAt(0) || "?"}</div>`;
      }

      return `
      <div class="ride-card" onclick="openRideDetails('${ride._id}')">
        <div class="ride-header">
          ${avatarHTML}
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
