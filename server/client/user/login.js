document.getElementById("loginForm").addEventListener("submit", async (e) => { //read from form
   
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("🔄 Attempting login...");

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ CRITICAL - Sends/receives cookies
      body: JSON.stringify({ email, password }),
    });

    console.log("📊 Response status:", res.status);

    const result = await res.json();
    console.log("📦 Response data:", result);

    if (res.ok) {
      console.log("✅ Login successful!");
      
      // Check if cookie was set
      console.log("🍪 Document cookies:", document.cookie);
      
      alert("Login successful! Redirecting...");
      
      // Redirect to index
      window.location.href = "/index.html";
      
    } else {
      console.error("❌ Login failed:", result.message);
      alert(result.message || "Login failed");
    }
  } catch (error) {
    console.error("💥 Network error:", error);
    alert("Network error - Is your server running?");
  }
});