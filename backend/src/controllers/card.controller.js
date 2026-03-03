const Deck = require('../models/Deck');
const Card = require('../models/Card');

exports.getDeckCards = async (req, res) => {
  try {
    const { id } = req.params;

    const deck = await Deck.findById(id);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });

    if (!deck.isPublic)
      return res.status(403).json({ message: 'Deck is private' });

    const cards = await Card.find({ deckId: id });

    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};