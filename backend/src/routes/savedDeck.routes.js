const express = require('express');
const {
  saveDeck,
  unsaveDeck,
  getSavedDecks,
  getDeckProgress,
} = require('../controllers/savedDeck.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// GET  /api/saved-decks              — danh sách deck đã lưu + progress tóm tắt
// POST /api/saved-decks/:deckId      — lưu một deck
// DELETE /api/saved-decks/:deckId    — bỏ lưu một deck
// GET  /api/saved-decks/:deckId/progress — progress chi tiết từng card

// QUAN TRỌNG: route tĩnh (/progress) đặt sau route cụ thể có param
// Express sẽ không nhầm "progress" thành deckId vì route này nhận thêm segment

router.get('/', authMiddleware, getSavedDecks);
router.post('/:deckId', authMiddleware, saveDeck);
router.delete('/:deckId', authMiddleware, unsaveDeck);
router.get('/:deckId/progress', authMiddleware, getDeckProgress);

module.exports = router;