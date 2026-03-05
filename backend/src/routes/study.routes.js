const express = require('express');
const { initSrs, getStudySession } = require('../controllers/Study.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// POST /api/study/:deckId/init-srs — khởi tạo SRS records cho deck (idempotent)
router.post('/:deckId/init-srs', authMiddleware, initSrs);

// GET /api/study/:deckId/session — lấy cards cần học hôm nay
router.get('/:deckId/session', authMiddleware, getStudySession);

module.exports = router;