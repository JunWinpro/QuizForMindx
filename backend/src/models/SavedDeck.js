const mongoose = require('mongoose');

const SavedDeckSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true,
    },
  },
  { timestamps: true }
);

// Mỗi user chỉ lưu 1 deck 1 lần
SavedDeckSchema.index({ userId: 1, deckId: 1 }, { unique: true });

// Query danh sách saved decks của user, sort mới nhất trước
SavedDeckSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavedDeck', SavedDeckSchema);