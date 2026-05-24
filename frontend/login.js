async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("LOGIN ATTEMPT:", email);

  const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  console.log("RESPONSE:", data);

  if (!res.ok) {
    alert(data.message || "Login failed");
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  alert("Login successful");
  window.location.href = "dashboard.html";
}