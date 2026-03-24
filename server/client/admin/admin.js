const form = document.getElementById("adminLoginForm");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;


  try {
    const res = await fetch("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email,
    password  // ✅ small p
  })
});


    const data = await res.json();

    if (!res.ok) {
      document.getElementById("error").innerText = data.message;
      return;
    }

    // ❌ DO NOT use localStorage for admin token
    // Cookie is already stored by browser

    // ✅ Redirect to admin dashboard
    window.location.href = "/admin/admindashboard.html";

  } catch (err) {
    document.getElementById("error").innerText = "Something went wrong";
  }
});
