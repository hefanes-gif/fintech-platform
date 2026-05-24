const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static("public"));

// ================= SUPABASE =================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("FINTECH API RUNNING 🚀");
});

app.get("/api", (req, res) => {
  res.json({ status: "FINTECH LIVE 🚀" });
});

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ================= REGISTER =================
app.post("/api/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase.from("users").insert([
    {
      name,
      email,
      phone,
      password: hash,
      balance: 0,
      role: "user"
    }
  ]);

  if (error) return res.status(400).json(error);

  res.json({ success: true, data });
});

// ================= LOGIN =================
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
});

// ================= WALLET =================
app.get("/api/wallet", auth, async (req, res) => {
  const { data } = await supabase
    .from("users")
    .select("balance")
    .eq("id", req.user.id)
    .single();

  res.json(data);
});

// ================= TRANSACTIONS =================
app.get("/api/transactions", auth, async (req, res) => {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  res.json(data);
});

// ================= WITHDRAW REQUEST =================
app.post("/api/withdraw", auth, async (req, res) => {
  const { phone, amount } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const { data, error } = await supabase.from("withdrawals").insert([
    {
      user_id: req.user.id,
      phone,
      amount,
      status: "pending"
    }
  ]);

  if (error) return res.status(400).json(error);

  res.json({ success: true, data });
});

// ================= ADMIN WITHDRAWALS =================
app.get("/api/admin/withdrawals", async (req, res) => {
  const { data } = await supabase
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  res.json(data);
});

// ================= ADMIN APPROVE WITHDRAWAL =================
app.post("/api/admin/withdraw/approve", async (req, res) => {
  const { id } = req.body;

  const { data: withdrawal } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", id)
    .single();

  if (!withdrawal) return res.status(404).json({ error: "Not found" });

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", withdrawal.user_id)
    .single();

  const newBalance = Number(user.balance) - Number(withdrawal.amount);

  await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", user.id);

  await supabase
    .from("withdrawals")
    .update({ status: "approved" })
    .eq("id", id);

  res.json({ success: true });
});

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("FINTECH LIVE 🚀 ON PORT", PORT);
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});