const Deck = require('../models/Deck');

exports.getPublicDecks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const decks = await Deck.find({ isPublic: true })
      .select('_id name language cardCount description')
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(decks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};