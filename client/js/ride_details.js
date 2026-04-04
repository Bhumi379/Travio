import { API_BASE } from "./config.js";
import { showError, showSuccess } from "./utils.js";

/** Latest ride from GET /rides/:id — used for edit prefill and PUT payload merge. */
let rideEditSnapshot = null;

function getRideId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("rideId");
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function toDownloadUrl(rawUrl) {
  if (!rawUrl) return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  const uploadsIndex = rawUrl.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `${window.location.origin}${rawUrl.slice(uploadsIndex)}`;
  }
  return rawUrl;
}

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeIndianMobile10(raw) {
  if (raw == null || !String(raw).trim()) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91")) {
    const rest = digits.slice(2);
    if (/^[6-9]\d{9}$/.test(rest)) return rest;
  }
  return null;
}

function buildDetailsHTML(ride, requests = [], currentUserId = null, canViewDriverDetails = false) {
  const departure = ride.departureTime || ride.createdAt;
  const pickupName = ride.pickup?.name || "Pickup";
  const pickupAddr = ride.pickup?.address || "";
  const destName = ride.destination?.name || "Destination";
  const destAddr = ride.destination?.address || "";
  const avatar = (ride.initiatorName?.charAt(0) || "?").toUpperCase();
  const initiatorName = ride.initiatorName || "Host";
  const creatorPic = ride.initiatorProfilePicture || "";

  const isCab = ride.rideType === "cab";
  const price =
    isCab && ride.fare != null ? `₹${Number(ride.fare).toFixed(0)} (Total)` : "—";

  const accepted = requests.filter((r) => r.status === "accepted");
  const pending = requests.filter((r) => r.status === "pending");
  const rideOwnerId =
    typeof ride.initiatorId === "object" ? ride.initiatorId?._id : ride.initiatorId;
  const isOwner = currentUserId && String(rideOwnerId) === String(currentUserId);
  const aadharUrl = toDownloadUrl(ride.driver?.aadharImage);
  const licenseUrl = toDownloadUrl(ride.driver?.driverLicenseImage);

  return `
    <section class="details-card">
      <div class="route-strip">
        <div>
          <div>${formatDate(departure)}</div>
          <small>${formatTime(departure)}</small>
        </div>
        <div>
          <small>${isCab ? "🚖 Cab ride" : "🤝 Travel buddy ride"}</small>
        </div>
      </div>

      <div class="segment-row">
        <div class="seg-time">${formatTime(departure)}</div>
        <div class="seg-body">
          <div class="seg-city">${pickupName}</div>
          <div class="seg-address">${pickupAddr}</div>
        </div>
      </div>

      <div class="segment-row">
        <div class="seg-time"></div>
        <div class="seg-body">
          <div class="seg-city">${destName}</div>
          <div class="seg-address">${destAddr}</div>
        </div>
      </div>

      <div class="driver-block">
        <div class="driver-avatar-big" ${
          creatorPic
            ? `style="background-image:url('${creatorPic}');background-size:cover;background-position:center;color:transparent;"`
            : ""
        }>${avatar}</div>
        <div class="driver-info">
          <h3>${initiatorName}</h3>
          <p>Ride creator</p>
        </div>
      </div>

      <div class="badge-row">
        <span class="pill-badge"><i class="fa-solid fa-id-card"></i> Verified profile</span>
        <span class="pill-badge"><i class="fa-solid fa-clock"></i> Instant booking</span>
        <span class="pill-badge"><i class="fa-solid fa-user-group"></i> ${
          typeof ride.seats === "number" ? `${ride.seats} seats` : "Seats info"
        }</span>
      </div>

      <ul class="rules-list">
        ${canViewDriverDetails && ride.driver?.name ? `<li><i class="fa-solid fa-user-tie"></i> Driver: ${ride.driver.name}</li>` : ""}
        ${canViewDriverDetails && ride.driver?.vehicleNumber ? `<li><i class="fa-solid fa-car-side"></i> Vehicle: ${ride.driver.vehicleNumber}</li>` : ""}
        ${
          canViewDriverDetails && aadharUrl
            ? `<li><i class="fa-solid fa-id-card"></i> Aadhar: <a href="${aadharUrl}" download target="_blank" rel="noopener noreferrer">Download</a></li>`
            : ""
        }
        ${
          canViewDriverDetails && licenseUrl
            ? `<li><i class="fa-solid fa-file-lines"></i> Driving License: <a href="${licenseUrl}" download target="_blank" rel="noopener noreferrer">Download</a></li>`
            : ""
        }
        ${
          isCab && !canViewDriverDetails
            ? `<li><i class="fa-solid fa-lock"></i> Driver details are visible after your request is accepted</li>`
            : ""
        }
      </ul>

      ${
        accepted.length
          ? `<h3 style="margin-top:18px;font-size:15px;font-weight:800;color:#111827;">Passengers who joined</h3>
        <ul class="rules-list">
          ${accepted
            .map(
              (req) => `
            <li>
              <i class="fa-solid fa-user-check"></i>
              <span>${req.userId?.name || "Passenger"} (${req.userId?.email || ""})</span>
              ${
                isOwner
                  ? `<button class="summary-btn" style="margin-left:auto;padding:6px 10px;font-size:12px;" onclick="removeParticipant('${ride._id}','${req.userId?._id || req.userId}','${req.userId?.name || "Passenger"}')">Remove</button>`
                  : ""
              }
            </li>`
            )
            .join("")}
        </ul>`
          : ""
      }

      ${
        pending.length
          ? `<h3 style="margin-top:18px;font-size:15px;font-weight:800;color:#111827;">Join requests</h3>
        <ul class="rules-list">
          ${pending
            .map(
              (req) => `
            <li>
              <i class="fa-solid fa-user-clock"></i>
              <span>${req.userId?.name || "Student"} – pending</span>
            </li>`
            )
            .join("")}
        </ul>`
          : ""
      }

      <div class="report-link">Report ride</div>
    </section>

    <aside class="summary-card">
      <h4>Ride summary</h4>
      <div class="summary-line">
        <span>From</span>
        <span>${pickupName}</span>
      </div>
      <div class="summary-line">
        <span>To</span>
        <span>${destName}</span>
      </div>
      <div class="summary-line">
        <span>Passengers</span>
        <span>${typeof ride.seats === "number" ? ride.seats : "1"} passenger</span>
      </div>
      <div class="summary-price">${price}</div>

      <div class="summary-actions">
        <button class="summary-btn" onclick="openChat('${ride._id}')">Chat</button>
        ${
          isOwner
            ? `<button type="button" class="summary-btn" onclick="openUserRideEditModal()">Edit ride</button>
        <button class="summary-btn primary" style="background:#ef4444;box-shadow:none;" onclick="cancelRide('${ride._id}')">Cancel Ride</button>`
            : `<button class="summary-btn primary" onclick="requestRide('${ride._id}')">Request</button>`
        }
      </div>
    </aside>
  `;
}

async function getCurrentUserId() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
    const data = await res.json();
    return data?.user?._id || data?.user?.id || null;
  } catch {
    return null;
  }
}

function setUserRideEditError(msg) {
  const el = document.getElementById("userRideEditErr");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-visible", Boolean(msg));
}

function populateUserRideEditForm(ride) {
  rideEditSnapshot = ride;
  document.getElementById("userEditPickupName").value = ride.pickup?.name || "";
  document.getElementById("userEditPickupAddr").value = ride.pickup?.address || "";
  document.getElementById("userEditDestName").value = ride.destination?.name || "";
  document.getElementById("userEditDestAddr").value = ride.destination?.address || "";
  document.getElementById("userEditDeparture").value = toDatetimeLocalValue(
    ride.departureTime || ride.createdAt
  );
  document.getElementById("userEditNotes").value = ride.notes || "";

  const cabBlock = document.getElementById("userEditCabFields");
  const isCab = ride.rideType === "cab";
  cabBlock.classList.toggle("hidden", !isCab);
  if (isCab) {
    document.getElementById("userEditSeats").value =
      ride.seats != null ? String(ride.seats) : "1";
    document.getElementById("userEditFare").value =
      ride.fare != null && ride.fare !== "" ? String(ride.fare) : "";
    document.getElementById("userEditDriverName").value = ride.driver?.name || "";
    document.getElementById("userEditVehicle").value = ride.driver?.vehicleNumber || "";
    document.getElementById("userEditDriverPhone").value = ride.driver?.contactNumber || "";
  }
}

function openUserRideEditModal() {
  const ride = rideEditSnapshot;
  if (!ride || !ride._id) {
    showError("Ride data is not loaded yet.");
    return;
  }
  const rideOwnerId =
    typeof ride.initiatorId === "object" ? ride.initiatorId?._id : ride.initiatorId;
  getCurrentUserId().then((uid) => {
    if (!uid || String(rideOwnerId) !== String(uid)) {
      showError("Only the ride creator can edit this ride.");
      return;
    }
    setUserRideEditError("");
    populateUserRideEditForm(ride);
    const backdrop = document.getElementById("rideEditBackdrop");
    if (backdrop) {
      backdrop.classList.add("is-open");
      backdrop.setAttribute("aria-hidden", "false");
    }
  });
}

function closeUserRideEditModal() {
  const backdrop = document.getElementById("rideEditBackdrop");
  if (backdrop) {
    backdrop.classList.remove("is-open");
    backdrop.setAttribute("aria-hidden", "true");
  }
  setUserRideEditError("");
}

async function submitUserRideEdit(e) {
  e.preventDefault();
  setUserRideEditError("");

  const ride = rideEditSnapshot;
  if (!ride || !ride._id) {
    setUserRideEditError("No ride loaded.");
    return;
  }

  const pickupName = document.getElementById("userEditPickupName").value.trim();
  const pickupAddr = document.getElementById("userEditPickupAddr").value.trim();
  const destName = document.getElementById("userEditDestName").value.trim();
  const destAddr = document.getElementById("userEditDestAddr").value.trim();
  const depVal = document.getElementById("userEditDeparture").value;
  const notesRaw = document.getElementById("userEditNotes").value.trim();

  if (!pickupName || !destName) {
    setUserRideEditError("Pickup and destination names are required.");
    return;
  }
  if (!depVal) {
    setUserRideEditError("Please set departure date and time.");
    return;
  }
  if (notesRaw.length > 0 && notesRaw.length < 3) {
    setUserRideEditError("Notes must be at least 3 characters, or leave empty.");
    return;
  }

  const departureTime = new Date(depVal).toISOString();
  const pickup = {
    ...(ride.pickup || {}),
    name: pickupName,
    address: pickupAddr,
  };
  const destination = {
    ...(ride.destination || {}),
    name: destName,
    address: destAddr,
  };

  const payload = {
    rideType: ride.rideType,
    pickup,
    destination,
    departureTime,
  };
  if (notesRaw.length >= 3) payload.notes = notesRaw;

  if (ride.rideType === "cab") {
    const seats = parseInt(document.getElementById("userEditSeats").value, 10);
    const fareRaw = document.getElementById("userEditFare").value;
    if (!Number.isFinite(seats) || seats < 1 || seats > 8) {
      setUserRideEditError("Seats must be between 1 and 8.");
      return;
    }
    payload.seats = seats;
    if (fareRaw !== "" && fareRaw != null) {
      const fare = parseFloat(fareRaw);
      if (Number.isNaN(fare) || fare < 0) {
        setUserRideEditError("Fare must be a non-negative number.");
        return;
      }
      payload.fare = fare;
    }

    const driverName = document.getElementById("userEditDriverName").value.trim();
    const vehicle = document.getElementById("userEditVehicle").value.trim().toUpperCase();
    const phoneRaw = document.getElementById("userEditDriverPhone").value.trim();
    if (vehicle && !/^[A-Z0-9\- ]{5,15}$/i.test(vehicle)) {
      setUserRideEditError("Vehicle number format is invalid (5–15 characters).");
      return;
    }

    const driver = { ...(ride.driver || {}) };
    if (driverName) driver.name = driverName;
    if (vehicle) driver.vehicleNumber = vehicle;
    if (phoneRaw) {
      const p10 = normalizeIndianMobile10(phoneRaw);
      if (!p10) {
        setUserRideEditError(
          "Driver phone must be 10 digits (Indian mobile starting 6–9), optionally with +91."
        );
        return;
      }
      driver.contactNumber = p10;
    }

    payload.driver = driver;
  }

  try {
    const res = await fetch(`${API_BASE}/rides/${encodeURIComponent(ride._id)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      const msg =
        (Array.isArray(data.errors) && data.errors.join("; ")) ||
        data.message ||
        data.error ||
        "Failed to update ride";
      setUserRideEditError(msg);
      return;
    }
    showSuccess("Ride updated");
    closeUserRideEditModal();
    await loadRideDetails();
  } catch (err) {
    setUserRideEditError(err.message || "Network error");
  }
}

async function cancelRide(rideId) {
  const ok = window.confirm("Are you sure you want to cancel this ride for everyone?");
  if (!ok) return;

  try {
    const res = await fetch(`${API_BASE}/rides/${encodeURIComponent(rideId)}/cancel`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to cancel ride");
    showSuccess("Ride cancelled successfully");
    setTimeout(() => {
      window.location.href = "previous_ride.html";
    }, 1000);
  } catch (err) {
    showError(err.message || "Failed to cancel ride");
  }
}

async function removeParticipant(rideId, participantUserId, participantName = "participant") {
  const ok = window.confirm(`Remove ${participantName} from this ride?`);
  if (!ok) return;

  try {
    const res = await fetch(
      `${API_BASE}/rides/${encodeURIComponent(rideId)}/participants/${encodeURIComponent(participantUserId)}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to remove participant");
    }
    showSuccess("Participant removed");
    await loadRideDetails();
  } catch (err) {
    showError(err.message || "Failed to remove participant");
  }
}

async function loadRideDetails() {
  try {
    const rideId = getRideId();
    if (!rideId) {
      showError("Ride ID is missing");
      return;
    }

    const res = await fetch(`${API_BASE}/rides/${encodeURIComponent(rideId)}`, {
      credentials: "include",
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load ride");
    }

    rideEditSnapshot = data.data || null;

    const currentUserId = await getCurrentUserId();
    const rideOwnerId =
      typeof data.data?.initiatorId === "object" ? data.data?.initiatorId?._id : data.data?.initiatorId;
    const isOwner = currentUserId && String(rideOwnerId) === String(currentUserId);

    let requests = [];
    let myRequestStatus = null;

    try {
      const statusRes = await fetch(
        `${API_BASE}/ride-requests/${encodeURIComponent(rideId)}/request-status`,
        { credentials: "include" }
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success && statusData.hasRequest) {
          myRequestStatus = statusData.data?.status || null;
        }
      }
    } catch (_err) {
      myRequestStatus = null;
    }

    try {
      if (isOwner) {
        const reqRes = await fetch(
          `${API_BASE}/ride-requests/${encodeURIComponent(rideId)}/requests`,
          { credentials: "include" }
        );
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData.success && Array.isArray(reqData.data)) {
            requests = reqData.data;
          }
        }
      } else {
        const paxRes = await fetch(
          `${API_BASE}/ride-requests/${encodeURIComponent(rideId)}/passengers`,
          { credentials: "include" }
        );
        if (paxRes.ok) {
          const paxData = await paxRes.json();
          if (paxData.success && Array.isArray(paxData.data)) {
            requests = paxData.data;
          }
        }
      }
    } catch (_err) {
      // Silently ignore; section just won't show
    }

    const root = document.getElementById("rideDetailsRoot");
    if (!root) return;

    const canViewDriverDetails = Boolean(isOwner || myRequestStatus === "accepted");
    root.innerHTML = buildDetailsHTML(data.data, requests, currentUserId, canViewDriverDetails);
  } catch (err) {
    showError(err.message || "Something went wrong");
  }
}

window.cancelRide = cancelRide;
window.removeParticipant = removeParticipant;
window.openUserRideEditModal = openUserRideEditModal;

document.addEventListener("DOMContentLoaded", () => {
  loadRideDetails();

  document.getElementById("userRideEditForm")?.addEventListener("submit", submitUserRideEdit);
  document.getElementById("rideEditCloseBtn")?.addEventListener("click", closeUserRideEditModal);
  document.getElementById("userRideEditCancel")?.addEventListener("click", closeUserRideEditModal);
  document.getElementById("rideEditBackdrop")?.addEventListener("click", (ev) => {
    if (ev.target === ev.currentTarget) closeUserRideEditModal();
  });
});
