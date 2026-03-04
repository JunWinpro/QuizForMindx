const express = require('express');
const {
  getPublicDecks,
  createDeck,
  getUserDecks,
  updateDeck,
  deleteDeck,
} = require('../controllers/deck.controller');
const { getDeckCards, createCard, getCardsByDeck, updateCard, deleteCard } = require('../controllers/card.controller');
const authMiddleware = require('../middlewares/Auth.middleware');

const router = express.Router();

// ─── Public (Stage 1) ───────────────────────────────────────────────────────
router.get('/public', getPublicDecks);

// /api/decks/:id/cards — public (no auth, deck must be isPublic)
router.get('/:id/cards', getDeckCards);

// ─── Authenticated Deck CRUD (Stage 3) ─────────────────────────────────────
router.post('/', authMiddleware, createDeck);
router.get('/', authMiddleware, getUserDecks);
router.put('/:id', authMiddleware, updateDeck);
router.delete('/:id', authMiddleware, deleteDeck);

// ─── Authenticated Card CRUD (Stage 4) ─────────────────────────────────────
router.post('/:deckId/cards', authMiddleware, createCard);
router.get('/:deckId/cards/manage', authMiddleware, getCardsByDeck);
router.put('/:deckId/cards/:cardId', authMiddleware, updateCard);
router.delete('/:deckId/cards/:cardId', authMiddleware, deleteCard);

module.exports = router;