const router = require('express').Router();
const supabase = require('../config/supabase');

/**
 * SUBMIT PROOF
 */
router.post('/submit', async (req, res) => {
  const { user_id, task_id, image_url } = req.body;

  const { data, error } = await supabase
    .from('submissions')
    .insert([
      {
        user_id,
        task_id,
        image_url,
        status: 'pending'
      }
    ]);

  if (error) return res.status(400).json(error);

  res.json({ message: 'Submitted for approval', data });
});

/**
 * GET ALL SUBMISSIONS (ADMIN)
 */
router.get('/', async (req, res) => {
  const { data } = await supabase
    .from('submissions')
    .select('*');

  res.json(data);
});

module.exports = router;