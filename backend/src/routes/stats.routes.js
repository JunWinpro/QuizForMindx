const express = require('express');
const { getProgress, getActivity, updateStreak } = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// GET /api/stats/progress — thống kê tổng hợp (totalWordsLearned, accuracy, streak…)
router.get('/progress', authMiddleware, getProgress);

// GET /api/stats/activity — hoạt động 7 ngày qua
router.get('/activity', authMiddleware, getActivity);

// PUT /api/stats/streak — cập nhật streak sau study session
router.put('/streak', authMiddleware, updateStreak);

module.exports = router;