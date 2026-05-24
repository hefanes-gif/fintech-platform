const supabase = require('../config/supabase');

// ADD EARNING
exports.addEarning = async (userId, amount, description) => {

  // 1. Get current balance
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();

  const newBalance = Number(user.balance) + Number(amount);

  // 2. Update balance
  await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', userId);

  // 3. Log transaction
  await supabase
    .from('wallet_transactions')
    .insert([
      {
        user_id: userId,
        type: 'earning',
        amount,
        description
      }
    ]);

  return newBalance;
};