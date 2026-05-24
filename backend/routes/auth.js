const router = require('express').Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * =========================
 * REGISTER USER
 * =========================
 */
router.post('/register', async (req, res) => {
  try {
    console.log("📥 REGISTER REQUEST:", req.body);

    const { name, email, phone, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email: email.toLowerCase(),
          phone,
          password: hashedPassword,
          balance: 0
        }
      ])
      .select();

    if (error) {
      console.log("🔥 SUPABASE ERROR:", error);
      return res.status(400).json({
        message: error.message,
        error
      });
    }

    return res.json({
      message: "User registered successfully",
      user: data[0]
    });

  } catch (err) {
    console.log("💥 SERVER ERROR:", err);
    return res.status(500).json({
      message: err.message
    });
  }
});

/**
 * =========================
 * LOGIN USER
 * =========================
 */
router.post('/login', async (req, res) => {
  try {
    console.log("📥 LOGIN REQUEST:", req.body);

    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({
        message: "Wrong password"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret"
    );

    return res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    console.log("💥 LOGIN ERROR:", err);
    return res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;