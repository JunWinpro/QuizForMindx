const mongoose = require('mongoose');

const DeckSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },
    description: String,
    language: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    cardCount: {
      type: Number,
      default: 0,
    },
    ownerId: {
      type: String,
      default: null,
    },
    ownerName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

DeckSchema.index({ isPublic: 1, createdAt: -1 });
DeckSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Deck', DeckSchema);