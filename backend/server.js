const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ================= SUPABASE =================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

// ================= HOME =================
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

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
  if (!valid) return res.status(401).json({ error: "Wrong password" });

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

// ================= MPESA TOKEN =================
async function getToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return res.data.access_token;
}

// ================= STK PUSH (DEPOSIT) =================
app.post("/api/mpesa/stkpush", auth, async (req, res) => {
  const { phone, amount } = req.body;

  const token = await getToken();

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const response = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "FINTECH",
      TransactionDesc: "Deposit"
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.json(response.data);
});

// ================= WITHDRAW REQUEST (SAFE LAYER) =================
app.post("/api/wallet/withdraw", auth, async (req, res) => {
  const { phone, amount } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const newBalance = Number(user.balance) - Number(amount);

  await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", user.id);

  await supabase.from("withdrawals").insert([
    {
      user_id: user.id,
      phone,
      amount,
      status: "pending"
    }
  ]);

  res.json({
    success: true,
    message: "Withdrawal queued for B2C payout",
    newBalance
  });
});

// ================= MPESA B2C WITHDRAWAL =================
app.post("/api/mpesa/b2c", async (req, res) => {
  const { phone, amount } = req.body;

  const token = await getToken();

  const response = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
    {
      InitiatorName: process.env.MPESA_INITIATOR,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: phone,
      Remarks: "Withdrawal",
      QueueTimeOutURL: process.env.MPESA_B2C_TIMEOUT_URL,
      ResultURL: process.env.MPESA_B2C_RESULT_URL,
      Occasion: "Wallet Withdrawal"
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.json(response.data);
});

// ================= CALLBACK =================
app.post("/api/mpesa/callback", async (req, res) => {
  console.log("CALLBACK:", JSON.stringify(req.body));

  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// ================= ADMIN =================
app.get("/api/admin/users", async (req, res) => {
  const { data } = await supabase.from("users").select("*");
  res.json(data);
});

app.get("/api/admin/withdrawals", async (req, res) => {
  const { data } = await supabase.from("withdrawals").select("*");
  res.json(data);
});

// ================= START =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("FINTECH LEVEL 3 LIVE 🚀", PORT));