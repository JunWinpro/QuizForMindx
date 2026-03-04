const Card = require('../models/Card');
const Deck = require('../models/Deck');

// Helper: verify deck exists + optionally check ownership
const findDeckAndVerify = async (deckId, userId = null) => {
  const deck = await Deck.findById(deckId);
  if (!deck) return { deck: null, error: 'Deck not found', status: 404 };
  if (userId && String(deck.ownerId) !== userId) {
    return { deck: null, error: 'Forbidden', status: 403 };
  }
  return { deck, error: null };
};

// ─── STAGE 1 ────────────────────────────────────────────────────────────────

// GET /api/decks/:id/cards  — public deck, no auth needed
const getDeckCards = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    // Allow access if deck is public OR user owns it (checked elsewhere via auth middleware)
    if (!deck.isPublic && !req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const [cards, total] = await Promise.all([
      Card.find({ deckId: req.params.id })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Card.countDocuments({ deckId: req.params.id }),
    ]);

    return res.status(200).json({
      success: true,
      data: cards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STAGE 4 ────────────────────────────────────────────────────────────────

// POST /api/decks/:deckId/cards
const createCard = async (req, res) => {
  try {
    const { deck, error, status } = await findDeckAndVerify(req.params.deckId, req.user.userId);
    if (error) return res.status(status).json({ success: false, message: error });

    const { front, back, example, phonetic, audioUrl, imageUrl } = req.body;
    if (!front || !back) {
      return res.status(400).json({ success: false, message: 'front and back are required' });
    }

    const card = await Card.create({
      deckId: req.params.deckId,
      front,
      back,
      example: example || '',
      phonetic: phonetic || '',
      audioUrl: audioUrl || '',
      imageUrl: imageUrl || '',
    });

    // Increment cardCount
    await Deck.findByIdAndUpdate(req.params.deckId, { $inc: { cardCount: 1 } });

    return res.status(201).json({ success: true, data: card });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/decks/:deckId/cards  (authenticated — owner access)
const getCardsByDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });

    const isOwner = String(deck.ownerId) === req.user.userId;
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      Card.find({ deckId: req.params.deckId }).sort({ createdAt: 1 }).skip(skip).limit(limit),
      Card.countDocuments({ deckId: req.params.deckId }),
    ]);

    return res.status(200).json({
      success: true,
      data: cards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/decks/:deckId/cards/:cardId
const updateCard = async (req, res) => {
  try {
    const { error, status } = await findDeckAndVerify(req.params.deckId, req.user.userId);
    if (error) return res.status(status).json({ success: false, message: error });

    const card = await Card.findOneAndUpdate(
      { _id: req.params.cardId, deckId: req.params.deckId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    return res.status(200).json({ success: true, data: card });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/decks/:deckId/cards/:cardId
const deleteCard = async (req, res) => {
  try {
    const { error, status } = await findDeckAndVerify(req.params.deckId, req.user.userId);
    if (error) return res.status(status).json({ success: false, message: error });

    const card = await Card.findOneAndDelete({
      _id: req.params.cardId,
      deckId: req.params.deckId,
    });

    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    await Deck.findByIdAndUpdate(req.params.deckId, { $inc: { cardCount: -1 } });

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDeckCards, createCard, getCardsByDeck, updateCard, deleteCard };