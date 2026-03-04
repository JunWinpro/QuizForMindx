const express = require('express');
const {
  getPublicDecks,
  createDeck,
  getUserDecks,
  updateDeck,
  deleteDeck,
  getDeckById
} = require('../controllers/deck.controller');
const { getDeckCards, createCard, getCardsByDeck, updateCard, deleteCard } = require('../controllers/card.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// ─── Public Routes (không cần auth) ───────────────────────────────────────
router.get('/public', getPublicDecks);
router.get('/:id', getDeckById);     // ⭐ thêm dòng này
router.get('/:id/cards', getDeckCards);

// ─── Authenticated Routes - phải đặt trước route /:id ────────────────────
router.get('/my', authMiddleware, getUserDecks); // GET /api/decks/my - lấy decks của user
router.post('/', authMiddleware, createDeck);
router.put('/:id', authMiddleware, updateDeck);
router.delete('/:id', authMiddleware, deleteDeck);

// ─── Authenticated Card CRUD ─────────────────────────────────────────────
router.post('/:deckId/cards', authMiddleware, createCard);
router.get('/:deckId/cards/manage', authMiddleware, getCardsByDeck);
router.put('/:deckId/cards/:cardId', authMiddleware, updateCard);
router.delete('/:deckId/cards/:cardId', authMiddleware, deleteCard);

module.exports = router;