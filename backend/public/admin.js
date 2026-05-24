async function loadWithdrawals() {
  const res = await fetch(API + "/api/admin/withdrawals");
  const data = await res.json();

  const box = document.getElementById("withdrawals");
  box.innerHTML = "";

  data.forEach(w => {
    box.innerHTML += `
      <div style="background:#111;padding:10px;margin:10px;border-radius:8px">
        <p>Phone: ${w.phone}</p>
        <p>Amount: KES ${w.amount}</p>
        <p>Status: ${w.status}</p>

        ${w.status === "pending" ? `
          <button onclick="approve('${w.id}')">Approve</button>
        ` : ""}
      </div>
    `;
  });
}

async function approve(id) {
  await fetch(API + "/api/admin/withdraw/approve", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id })
  });

  alert("Approved");
  loadWithdrawals();
}

loadWithdrawals();