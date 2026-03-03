const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    front: {
      type: String,
      required: true,
    },
    back: {
      type: String,
      required: true,
    },
    example: String,
    phonetic: String,
    audioUrl: String,
    imageUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', CardSchema);