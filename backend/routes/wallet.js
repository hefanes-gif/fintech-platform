app.post("/api/wallet/withdraw", auth, async (req, res) => {
  try {
    const { phone, amount } = req.body;

    // ================= VALIDATION =================
    if (!phone || !amount) {
      return res.status(400).json({ error: "Phone and amount are required" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // ================= GET USER =================
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ================= CHECK BALANCE =================
    if (Number(user.balance) < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // ================= DEDUCT BALANCE =================
    const newBalance = Number(user.balance) - Number(amount);

    const { error: updateError } = await supabase
      .from("users")
      .update({ balance: newBalance })
      .eq("id", user.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    // ================= LOG WITHDRAWAL =================
    const { data, error } = await supabase.from("withdrawals").insert([
      {
        user_id: user.id,
        phone,
        amount: Number(amount),
        status: "processing"
      }
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // ================= RESPONSE =================
    res.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      newBalance,
      withdrawal: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});