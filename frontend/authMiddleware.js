<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Task Earnings Platform - Login</title>
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <div class="container">

    <h1>Welcome Back</h1>
    <p>Login to access your earnings dashboard</p>

    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Password">

    <button onclick="login()">Login</button>

    <p id="msg"></p>

    <hr>

    <small>
      Task Earnings System • WhatsApp Tasks • M-Pesa Withdrawals
    </small>

  </div>

  <script>
    const API = "http://localhost:5000/api/auth";

    async function login() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const msg = document.getElementById("msg");

      msg.innerText = "Logging in...";

      try {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          msg.innerText = "Login successful...";

          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 800);

        } else {
          msg.innerText = data.message || "Login failed";
        }

      } catch (error) {
        msg.innerText = "Server error. Try again.";
      }
    }
  </script>

</body>
</html>