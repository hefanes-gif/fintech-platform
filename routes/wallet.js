const router = require('express').Router();

const supabase = require('../config/supabase');

const { stkPush } = require('../utils/mpesa');

/**
 * GET BALANCE
 */
router.get('/:id', async (req, res) => {

  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('balance')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);

});

/**
 * WITHDRAW
 */
router.post('/withdraw', async (req, res) => {

  try {

    const { user_id, phone, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    // GET USER
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // CHECK BALANCE
    if (Number(user.balance) < Number(amount)) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    // CREATE TRANSACTION
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id,
        type: "withdrawal",
        amount,
        status: "pending"
      }])
      .select()
      .single();

    if (txError) {
      return res.status(500).json(txError);
    }

    // SEND STK PUSH
    const mpesaResponse = await stkPush(phone, amount);

    res.json({
      message: "STK Push sent",
      transaction: tx,
      mpesa: mpesaResponse
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Withdrawal failed",
      error: err.message
    });

  }

});

module.exports = router;