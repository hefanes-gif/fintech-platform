const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { getBalance } = require('../controllers/walletController');

router.get('/balance', auth, getBalance);

module.exports = router;