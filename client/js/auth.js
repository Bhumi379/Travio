// Authentication Functions
import { API_BASE, setCurrentUser } from './config.js';

function applyUserProfilePictureToUI(user) {
  if (!user) return;

  const fallbackHeaderAvatar = "images/profile.gif";
  const profileUrl = (user.profilePicture || "").trim();

  // Update all header avatar <img> tags across pages
  document.querySelectorAll("img.header-avatar").forEach((img) => {
    if (profileUrl) {
      img.src = profileUrl;
      img.style.objectFit = "cover";
    } else if (!img.getAttribute("src")) {
      img.src = fallbackHeaderAvatar;
    }
  });

  // Update all profile avatar <div> blocks (profile dashboard)
  document.querySelectorAll(".profile-avatar").forEach((avatarDiv) => {
    if (profileUrl) {
      avatarDiv.style.backgroundImage = `url('${profileUrl}')`;
      avatarDiv.style.backgroundSize = "cover";
      avatarDiv.style.backgroundPosition = "center";
      avatarDiv.textContent = "";
    } else {
      avatarDiv.style.backgroundImage = "none";
      avatarDiv.textContent = user.name?.charAt(0).toUpperCase() || "U";
    }
  });
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });

    const data = await res.json();

    if (!data.user) {
      console.warn("❌ No user found, redirecting to login");
      window.location.href = "/login.html";
      return;
    }

    // ✅ correct way
    setCurrentUser(data.user);

    console.log("✅ Current user loaded:", data.user);

    // Ensure profile page sidebar logic sees the saved picture too
    const selectedPicInput = document.getElementById("selectedProfilePicture");
    if (selectedPicInput && !selectedPicInput.value && data.user.profilePicture) {
      selectedPicInput.value = data.user.profilePicture;
    }

    // Profile page autofill
    const nameInput = document.getElementById("fullName");
    if (nameInput) {
      nameInput.value = data.user.name || "";
      document.getElementById("email").value = data.user.email || "";
      document.getElementById("banasthaliId").value = data.user.collegeId || "";
      document.getElementById("phone").value = data.user.contactNumber || "";
      document.getElementById("guardianPhone").value = data.user.guardianNumber || "";
    }

    applyUserProfilePictureToUI(data.user);

    document.querySelectorAll(".user-name").forEach(el => {
      el.textContent = data.user.name || "User";
    });

  } catch (err) {
    console.error("🔥 Error loading user data:", err);
    window.location.href = "/login.html";
  }
}

export function logout() {
  fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).then(() => window.location.href = "/login.html");
}

export async function updateCurrentUserProfile(payload) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    const errors = Array.isArray(data.errors) ? data.errors.join(", ") : null;
    throw new Error(errors || data.message || "Failed to update profile");
  }

  if (data.user) {
    setCurrentUser(data.user);
    applyUserProfilePictureToUI(data.user);
  }

  return data;
}
