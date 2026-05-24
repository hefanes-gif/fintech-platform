const supabase = require('../config/supabase');

exports.getSubmissions = async (req, res) => {
  const { data } = await supabase.from('task_submissions').select('*');
  res.json(data);
};

exports.createTask = async (req, res) => {
  const { title, description, reward } = req.body;

  const { data } = await supabase.from('tasks').insert([
    { title, description, reward }
  ]);

  res.json(data);
};

exports.approveTask = async (req, res) => {
  const { id } = req.body;

  const { data: sub } = await supabase
    .from('task_submissions')
    .select('*')
    .eq('id', id)
    .single();

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', sub.task_id)
    .single();

  await supabase
    .from('task_submissions')
    .update({ status: 'approved' })
    .eq('id', id);

  const { data: user } = await supabase
    .from('users')
    .select('balance')
    .eq('id', sub.user_id)
    .single();

  await supabase
    .from('users')
    .update({ balance: user.balance + task.reward })
    .eq('id', sub.user_id);

  res.json({ message: 'Approved' });
};