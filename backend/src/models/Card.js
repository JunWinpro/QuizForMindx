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
    audioUrl: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

CardSchema.index({ deckId: 1, createdAt: 1 });

module.exports = mongoose.model('Card', CardSchema);