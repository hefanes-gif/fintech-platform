const supabase = require('../config/supabase');

// APPROVE TASK
exports.approveTask = async (req, res) => {
  const { submission_id } = req.body;

  // 1. Get submission
  const { data: submission } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('id', submission_id)
    .single();

  if (!submission) {
    return res.status(404).json({ message: 'Not found' });
  }

  // 2. Get task reward
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', submission.task_id)
    .single();

  // 3. Mark approved
  await supabase
    .from('task_submissions')
    .update({ status: 'approved' })
    .eq('id', submission_id);

  // 4. Add money to user
  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', submission.user_id)
    .single();

  const newBalance = Number(user.balance) + Number(task.reward);

  await supabase
    .from('users')
    .update({ balance: newBalance })
    .eq('id', submission.user_id);

  // 5. Log transaction
  await supabase
    .from('wallet_transactions')
    .insert([
      {
        user_id: submission.user_id,
        type: 'earning',
        amount: task.reward,
        description: 'Task approved'
      }
    ]);

  res.json({ message: 'Task approved and paid', newBalance });
};