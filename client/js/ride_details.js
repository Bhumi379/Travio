import { API_BASE } from "./config.js";
import { showError, showSuccess } from "./utils.js";

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
          <p>${isCab ? "Cab driver" : "Ride creator"}</p>
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
            ? `<button class="summary-btn primary" style="background:#ef4444;box-shadow:none;" onclick="cancelRide('${ride._id}')">Cancel Ride</button>`
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

    // Try to fetch join requests (owner gets pending+accepted)
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

document.addEventListener("DOMContentLoaded", loadRideDetails);

