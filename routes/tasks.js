const router = require('express').Router();
const supabase = require('../config/supabase');

/**
 * CREATE TASK (ADMIN)
 */
router.post('/create', async (req, res) => {
  const { title, description, reward } = req.body;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, description, reward }]);

  if (error) return res.status(400).json(error);

  res.json({ message: 'Task created', data });
});

/**
 * GET ALL TASKS (USERS)
 */
router.get('/tasks', async (req, res) => {

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log("TASK ERROR:", error);
    return res.status(400).json(error);
  }

  res.json(data);

});

module.exports = router;