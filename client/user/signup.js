document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const profilePic = document.getElementById("profilePicture").value.trim();
  const guardianNum = document.getElementById("guardianNumber").value.trim();

  const data = {
    collegeId: document.getElementById("collegeId").value,
    name: document.getElementById("name").value,
    contactNumber: document.getElementById("contactNumber").value,
    email: document.getElementById("email").value,
    course: document.getElementById("course").value,
    password: document.getElementById("password").value,
  };

  if (guardianNum) data.guardianNumber = guardianNum;
  if (profilePic) data.profilePicture = profilePic;

  const res = await fetch("http://localhost:5000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const result = await res.json();
  console.log(result);

  if (res.ok) {
    alert("Signup successful!");
    window.location.href = "/login.html";
  } else {
    alert(result.message || "Signup failed");
  }
});
