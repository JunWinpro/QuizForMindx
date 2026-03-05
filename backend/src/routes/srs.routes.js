const express = require('express');
const { updateBatch, getDueCards, getSchedule } = require('../controllers/srs.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// PUT /api/srs/update-batch — cập nhật SRS sau study session
router.put('/update-batch', authMiddleware, updateBatch);

// GET /api/srs/due?deckId=<id> — lấy cards due hôm nay
router.get('/due', authMiddleware, getDueCards);

// GET /api/srs/schedule?deckId=<id> — lịch 7 ngày tới
router.get('/schedule', authMiddleware, getSchedule);

module.exports = router;