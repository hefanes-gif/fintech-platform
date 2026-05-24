const token = localStorage.getItem('token');

async function load() {

  const bal = await fetch('http://localhost:5000/api/wallet/balance', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const b = await bal.json();

  document.getElementById('balance').innerText = b.balance;

  const tasks = await fetch('http://localhost:5000/api/tasks', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await tasks.json();

  document.getElementById('tasks').innerHTML =
    data.map(t => `
      <div>
        <h4>${t.title}</h4>
        <button onclick="submit('${t.id}')">Submit</button>
      </div>
    `).join('');
}

async function submit(id) {
  const url = prompt("Screenshot URL");

  await fetch('http://localhost:5000/api/tasks/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ task_id: id, screenshot_url: url })
  });

  alert('Submitted');
}
async function requestWithdraw(){

  const userId = localStorage.getItem("userId");

  const phone = document.getElementById("phone").value;
  const amount = document.getElementById("amount").value;

  const res = await fetch(`${API}/wallet/withdraw`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      user_id:userId,
      phone,
      amount
    })
  });

  const data = await res.json();
  alert(data.message || "Requested");
}
load();