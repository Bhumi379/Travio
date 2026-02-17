// Authentication Functions
import { API_BASE, setCurrentUser } from './config.js';

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

    // Profile page autofill
    const nameInput = document.getElementById("fullName");
    if (nameInput) {
      nameInput.value = data.user.name || "";
      document.getElementById("email").value = data.user.email || "";
      document.getElementById("banasthaliId").value = data.user.collegeId || "";
      document.getElementById("phone").value = data.user.contactNumber || "";
      document.getElementById("guardianPhone").value = data.user.guardianNumber || "";
    }

    const avatarDiv = document.querySelector(".profile-avatar");
    if (avatarDiv) {
      avatarDiv.textContent = data.user.name?.charAt(0).toUpperCase() || "U";
    }

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
