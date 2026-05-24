/**
 * GET WITHDRAWALS
 */
router.get('/withdrawals', async (req, res) => {

  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('status', 'pending');

  if (error) return res.status(400).json(error);

  res.json(data);
});

/**
 * APPROVE WITHDRAWAL
 */
router.post('/withdrawals/approve', async (req, res) => {

  const { withdrawal_id } = req.body;

  // get withdrawal
  const { data: w } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawal_id)
    .single();

  if (!w) return res.status(404).json({ message: "Not found" });

  // get user
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', w.user_id)
    .single();

  // reduce balance
  const newBalance = Number(user.balance) - Number(w.amount);

  await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', w.user_id);

  // update withdrawal
  await supabase
    .from('withdrawals')
    .update({ status: "approved" })
    .eq('id', withdrawal_id);

  res.json({
    message: "Withdrawal approved",
    newBalance
  });
/**
 * POST TASKS
 */
router.post('/admin/tasks/create', async (req, res) => {

  const { title, description, reward, link } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title,
      description,
      reward,
      link
    }]);

  if (error) {
    console.log(error);
    return res.status(400).json(error);
  }

  res.json({ message: "Task created", data });

});