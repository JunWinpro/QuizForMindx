const mongoose = require('mongoose');

const SrsDataSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
    // SM-2 fields
    interval: {
      type: Number,
      default: 1,        // days until next review
    },
    easeFactor: {
      type: Number,
      default: 2.5,      // difficulty multiplier, min 1.3
    },
    repetitions: {
      type: Number,
      default: 0,        // consecutive correct answers
    },
    nextReview: {
      type: Date,
      default: Date.now, // review immediately on first time
    },
    lastReview: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index — 1 record per user per card
SrsDataSchema.index({ userId: 1, cardId: 1 }, { unique: true });

// Index for querying due cards efficiently
SrsDataSchema.index({ userId: 1, deckId: 1, nextReview: 1 });
SrsDataSchema.index({ userId: 1, nextReview: 1 });

module.exports = mongoose.model('SrsData', SrsDataSchema);