const express = require('express');
const {
  generateQuiz,
  saveResult,
  getHistory,
  getResultDetail,
} = require('../controllers/Quiz.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// QUAN TRỌNG: Route tĩnh (/result, /history) phải đặt TRƯỚC route động (/:deckId)
// để Express không nhầm "result" hay "history" thành deckId param.
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/quiz/result — lưu kết quả quiz sau khi hoàn thành
router.post('/result', authMiddleware, saveResult);

// GET /api/quiz/history — lịch sử quiz của user (có thể filter theo ?deckId=)
router.get('/history', authMiddleware, getHistory);

// GET /api/quiz/history/:resultId — chi tiết 1 kết quả (bao gồm wrongCards)
router.get('/history/:resultId', authMiddleware, getResultDetail);

// GET /api/quiz/:deckId/generate?count=20 — tạo câu hỏi trắc nghiệm
router.get('/:deckId/generate', authMiddleware, generateQuiz);

module.exports = router;