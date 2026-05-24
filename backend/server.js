const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ================= SUPABASE =================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);


// ================= HOME =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


// ================= TEST =================
app.get("/api", (req, res) => {
  res.json({
    status: "FINTECH LIVE 🚀"
  });
});


// ================= JWT AUTH =================
function auth(req, res, next) {

  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      error: "No token"
    });
  }

  try {

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    res.status(401).json({
      error: "Invalid token"
    });

  }

}


// ================= REGISTER =================
app.post("/api/auth/register", async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      password
    } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          name,
          email,
          phone,
          password: hash,
          balance: 0,
          role: "user"
        }
      ])
      .select();

    if (error) {
      return res.status(400).json(error);
    }

    res.json({
      success: true,
      data
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});


// ================= LOGIN =================
app.post("/api/auth/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(400).json({
        error: "User not found"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        error: "Wrong password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      token,
      user
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

});

// ================= WALLET =================
app.post("/api/deposit", async (req, res) => {
  const { user_id, amount } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();

  const newBalance = Number(user.balance) + Number(amount);

  await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("id", user_id);

  await supabase.from("transactions").insert([
    {
      user_id,
      type: "deposit",
      amount,
      status: "success"
    }
  ]);

  res.json({ success: true, balance: newBalance });
});

// ================= WALLET =================
app.get("/api/wallet", (req, res) => {
  res.json({ ok: true, test: "SERVER IS ALIVE" });
});

// ================= TRANSACTIONS =================
app.get("/api/transactions", async (req, res) => {
  const userId = req.query.user_id;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json(error);

  res.json(data);
});


// ================= WITHDRAW =================
app.post("/api/withdraw", async (req, res) => {
  const { user_id, amount, phone } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", user_id)
    .single();

  if (user.balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  await supabase.from("withdrawals").insert([
    {
      user_id,
      amount,
      phone,
      status: "pending"
    }
  ]);

  res.json({ success: true, message: "Withdrawal pending admin approval" });
});

// ================= ADMIN VIEW WITHDRAWALS =================
app.get("/api/admin/withdrawals", async (req, res) => {
  const { data } = await supabase
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  res.json(data);
});

// ================= ADMIN APPROVE =================
app.post("/api/admin/withdraw/approve", async (req, res) => {
  const { id } = req.body;

  const { data: w } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", id)
    .single();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", w.user_id)
    .single();

  const newBalance = Number(user.balance) - Number(w.amount);

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

// ================= REJECT WITHDRAWAL =================
app.post("/api/admin/withdraw/reject", async (req, res) => {
  const { id } = req.body;

  await supabase
    .from("withdrawals")
    .update({ status: "rejected" })
    .eq("id", id);

  res.json({ success: true });
});

// ================= 404 =================
app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  });

});


// ================= START =================
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log("FINTECH LIVE 🚀 ON", PORT);
});