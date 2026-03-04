const express = require('express');
const { register, login, getMe, updateProfile, updateSettings } = require('../controllers/Auth.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/settings', authMiddleware, updateSettings);

module.exports = router;