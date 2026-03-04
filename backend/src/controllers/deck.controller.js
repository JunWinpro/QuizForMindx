const Deck = require('../models/Deck');
const Card = require('../models/Card');

const LANGUAGE_WHITELIST = ['en', 'ja', 'ko', 'zh', 'fr', 'de', 'es', 'vi'];

// ─── STAGE 1 ────────────────────────────────────────────────────────────────

// GET /api/decks/public?page=1&limit=20
const getPublicDecks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [decks, total] = await Promise.all([
      Deck.find({ isPublic: true })
        .select('_id name language cardCount description createdAt ownerName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Deck.countDocuments({ isPublic: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: decks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STAGE 3 ────────────────────────────────────────────────────────────────

// POST /api/decks
const createDeck = async (req, res) => {
  try {
    const { name, description, language, isPublic } = req.body;

    if (!name || !language) {
      return res.status(400).json({ success: false, message: 'name and language are required' });
    }
    if (!LANGUAGE_WHITELIST.includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language' });
    }

    const deck = await Deck.create({
      name,
      description: description || '',
      language,
      isPublic: Boolean(isPublic),
      ownerId: req.user.userId,
      ownerName: req.user.displayName || '',
      cardCount: 0,
    });

    return res.status(201).json({ success: true, data: deck });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/decks?page=1&limit=20  — current user's decks
const getUserDecks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [decks, total] = await Promise.all([
      Deck.find({ ownerId: req.user.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Deck.countDocuments({ ownerId: req.user.userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: decks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
// GET /api/decks/:id
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: deck
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
// PUT /api/decks/:id
const updateDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (String(deck.ownerId) !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { name, description, language, isPublic } = req.body;
    if (language && !LANGUAGE_WHITELIST.includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language' });
    }

    const updated = await Deck.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(language && { language }),
          ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/decks/:id
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (String(deck.ownerId) !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Promise.all([
      Deck.findByIdAndDelete(req.params.id),
      Card.deleteMany({ deckId: req.params.id }),
    ]);

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getPublicDecks,
  createDeck,
  getUserDecks,
  updateDeck,
  deleteDeck,
  getDeckById
};