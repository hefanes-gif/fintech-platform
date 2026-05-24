async function loadUsers(){
  const res = await fetch("/api/admin/users");
  const data = await res.json();

  users.innerHTML = data.map(u =>
    `<div>${u.name} - ${u.balance}</div>`
  ).join("");
}

async function loadWithdrawals(){
  const res = await fetch("/api/admin/withdrawals");
  const data = await res.json();

  wd.innerHTML = data.map(w =>
    `<div>${w.phone} - ${w.amount} - ${w.status}</div>`
  ).join("");
}

loadUsers();
loadWithdrawals();