const express = require('express');
const {
  getPublicDecks,
  createDeck,
  getUserDecks,
  updateDeck,
  deleteDeck,
  getDeckById
} = require('../controllers/deck.controller');

const {
  getDeckCards,
  createCard,
  getCardsByDeck,
  updateCard,
  deleteCard
} = require('../controllers/card.controller');

const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// ─── Public Routes ─────────────────────────────
router.get('/public', getPublicDecks);

// ─── Authenticated Deck Routes ─────────────────
router.get('/my', authMiddleware, getUserDecks);   // ⭐ LẤY DECK CỦA USER
router.post('/', authMiddleware, createDeck);
router.put('/:id', authMiddleware, updateDeck);
router.delete('/:id', authMiddleware, deleteDeck);

// ─── Card Routes ───────────────────────────────
router.get('/:deckId/cards/manage', authMiddleware, getCardsByDeck);
router.post('/:deckId/cards', authMiddleware, createCard);
router.put('/:deckId/cards/:cardId', authMiddleware, updateCard);
router.delete('/:deckId/cards/:cardId', authMiddleware, deleteCard);

// ─── Public Deck Detail ────────────────────────
router.get('/:id', getDeckById);
router.get('/:id/cards', getDeckCards);

module.exports = router;