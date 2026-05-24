const supabase = require('../config/supabase');

// GET WALLET BALANCE
exports.getBalance = async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  if (error) return res.status(400).json(error);

  res.json({ balance: data.balance });
};