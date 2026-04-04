// signup.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const btn = document.getElementById("signupBtn");

  if (!form || !btn) {
    console.error("❌ Form or button not found. Check your HTML ids.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const guardianNum = document.getElementById("guardianNumber").value.trim();
    const email = document.getElementById("email").value.trim();

    if (email && !String(email).toLowerCase().endsWith("@banasthali.in")) {
      alert("Please use your @banasthali.in email to sign up.");
      return;
    }

    btn.disabled = true;
    btn.innerText = "Processing... ⏳";

    try {
      const data = {
        collegeId: document.getElementById("collegeId").value.trim(),
        name: document.getElementById("name").value.trim(),
        contactNumber: document.getElementById("contactNumber").value.trim(),
        email,
        course: document.getElementById("course").value.trim(),
        password: document.getElementById("password").value,
      };

      if (guardianNum) data.guardianNumber = guardianNum;

      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert("OTP sent to your email. Please verify.");
        localStorage.setItem("userEmail", data.email);
        window.location.href = "/verify.html";
      } else {
        alert(result.message || "Signup failed");
      }

    } catch (err) {
      console.error("Fetch error:", err);
      alert("Something went wrong. Is the server running?");
    } finally {
      btn.disabled = false;
      btn.innerText = "Create Account";
    }
  });
});