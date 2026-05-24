const supabase = require('../config/supabase');

exports.getTasks = async (req, res) => {
  const { data } = await supabase.from('tasks').select('*');
  res.json(data);
};

exports.submitTask = async (req, res) => {
  const { task_id, screenshot_url } = req.body;

  const { data, error } = await supabase.from('task_submissions').insert([
    {
      user_id: req.user.id,
      task_id,
      screenshot_url,
      status: 'pending'
    }
  ]);

  res.json({ data, error });
};