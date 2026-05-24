const API = "http://127.0.0.1:3001/api"; // change in production

function openDeposit() {
  document.getElementById("depositModal").style.display = "block";
}

function closeDeposit() {
  document.getElementById("depositModal").style.display = "none";
}

function openWithdraw() {
  document.getElementById("withdrawModal").style.display = "block";
}

function closeWithdraw() {
  document.getElementById("withdrawModal").style.display = "none";
}

// LOAD DASHBOARD
async function loadDashboard() {
  const wallet = await fetch(API + "/wallet").then(r => r.json());
  document.getElementById("balance").innerText = "KSh " + wallet.balance;
}

// LOAD TRANSACTIONS
async function loadTransactions() {
  const tx = await fetch(API + "/transactions").then(r => r.json());

  let html = "";
  tx.forEach(t => {
    html += `
      <tr>
        <td>${t.type}</td>
        <td>${t.amount}</td>
        <td>${t.status}</td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
      </tr>
    `;
  });

  document.getElementById("txTable").innerHTML = html;
}

// DEPOSIT
async function deposit() {
  const amount = document.getElementById("depAmount").value;

  await fetch(API + "/deposit", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ amount })
  });

  closeDeposit();
  loadDashboard();
}

// WITHDRAW
async function withdraw() {
  const amount = document.getElementById("withAmount").value;

  await fetch(API + "/withdraw", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ amount })
  });

  closeWithdraw();
  loadDashboard();
}

loadDashboard();
loadTransactions();