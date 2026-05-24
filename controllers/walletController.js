const supabase = require('../config/supabase');

exports.getBalance = async (req, res) => {
  const { id } = req.user;

  const { data } = await supabase
    .from('users')
    .select('balance')
    .eq('id', id)
    .single();

  res.json(data);
};