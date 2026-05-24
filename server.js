require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const moment = require("moment");
const { createClient } = require("@supabase/supabase-js");

const app = express();

/* ================= SECURITY ================= */
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
}));

/* ================= SUPABASE ================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/* ================= JWT ================= */
function generateToken(user){
  return jwt.sign(
    { id: user.id, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/* ================= AUTH MIDDLEWARE ================= */
function auth(req,res,next){
  const token = req.headers.authorization;

  if(!token){
    return res.status(401).json({message:"No token"});
  }

  try{
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();

  }catch(err){
    res.status(401).json({message:"Invalid token"});
  }
}

/* ================= ADMIN MIDDLEWARE ================= */
function admin(req,res,next){
  if(req.user.role !== "admin"){
    return res.status(403).json({message:"Admin only"});
  }
  next();
}

/* ================= REGISTER ================= */
app.post("/api/auth/register", async (req,res)=>{

  const {name,email,phone,password} = req.body;

  const hash = await bcrypt.hash(password,10);

  const { data, error } = await supabase
    .from("users")
    .insert([{
      name,
      email,
      phone,
      password: hash,
      role: "user",
      balance: 0
    }])
    .select()
    .single();

  if(error) return res.status(400).json(error);

  res.json({
    message:"Registered",
    user:data
  });

});

/* ================= LOGIN ================= */
app.post("/api/auth/login", async (req,res)=>{

  const {email,password} = req.body;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email",email)
    .single();

  if(!data){
    return res.status(400).json({message:"Invalid"});
  }

  const match = await bcrypt.compare(password,data.password);

  if(!match){
    return res.status(400).json({message:"Invalid"});
  }

  const token = generateToken(data);

  res.json({
    token,
    user:data
  });

});

/* ================= WALLET ================= */
app.get("/api/wallet", auth, async (req,res)=>{

  const { data } = await supabase
    .from("users")
    .select("balance")
    .eq("id",req.user.id)
    .single();

  res.json(data);

});

/* ================= TASKS ================= */
app.get("/api/tasks", auth, async (req,res)=>{

  const { data } = await supabase
    .from("tasks")
    .select("*");

  res.json(data);

});

/* ================= SUBMIT TASK ================= */
app.post("/api/tasks/submit", auth, async (req,res)=>{

  const {task_id,proof} = req.body;

  await supabase.from("submissions").insert([{
    user_id:req.user.id,
    task_id,
    proof,
    status:"pending"
  }]);

  res.json({message:"Submitted"});
});

/* ================= ADMIN STATS ================= */
app.get("/api/admin/stats", auth, admin, async (req,res)=>{

  const { data:users } = await supabase.from("users").select("*");

  const { data:tx } = await supabase.from("transactions").select("*");

  res.json({
    users:users.length,
    balance:users.reduce((a,b)=>a+Number(b.balance||0),0),
    transactions:tx.length
  });

});

/* ================= WITHDRAW REQUEST ================= */
app.post("/api/wallet/withdraw", auth, async (req,res)=>{

  const {phone,amount} = req.body;

  const { data:user } = await supabase
    .from("users")
    .select("*")
    .eq("id",req.user.id)
    .single();

  if(user.balance < amount){
    return res.status(400).json({message:"Low balance"});
  }

  await supabase.from("transactions").insert([{
    user_id:req.user.id,
    phone,
    amount,
    type:"withdrawal",
    status:"pending"
  }]);

  res.json({message:"Pending admin approval"});
});

/* ================= APPROVE WITHDRAWAL ================= */
app.post("/api/admin/withdraw/approve", auth, admin, async (req,res)=>{

  const { id } = req.body;

  await supabase
    .from("transactions")
    .update({status:"approved"})
    .eq("id",id);

  res.json({message:"Approved"});
});

/* ================= SERVER ================= */
app.listen(process.env.PORT || 5000, ()=>{
  console.log("🚀 FINTECH LEVEL 2 RUNNING");
});