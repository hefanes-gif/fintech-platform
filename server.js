const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= SUPABASE =================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    status: "LIVE 🚀",
    message: "Fintech backend running successfully",
    version: "1.0.0",
    endpoints: {
      register: "/api/auth/register",
      login: "/api/auth/login",
      tasks: "/api/tasks",
      adminUsers: "/api/admin/users"
    }
  });
});

// ================= AUTH =================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from("users").insert([
      {
        name,
        email,
        phone,
        password: hashedPassword,
        balance: 0,
        role: "user"
      }
    ]);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: "User not found" });
    }

    const valid = await bcrypt.compare(password, data.password);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: data.id, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= TASKS =================
app.get("/api/tasks", async (req, res) => {
  const { data, error } = await supabase.from("tasks").select("*");

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// CREATE TASK (ADMIN USE)
app.post("/api/tasks", async (req, res) => {
  const { title, reward } = req.body;

  const { data, error } = await supabase.from("tasks").insert([
    { title, reward }
  ]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, data });
});

// ================= ADMIN =================
app.get("/api/admin/users", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*");

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("FINTECH LIVE 🚀 ON PORT", PORT);
});