const express = require('express');
const {
  getPublicDecks,
} = require('../controllers/deck.controller');
const {
  getDeckCards,
} = require('../controllers/card.controller');

const router = express.Router();

router.get('/public', getPublicDecks);
router.get('/:id/cards', getDeckCards);

module.exports = router;