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
    // Thêm 2 field mới
    frontLanguage: {
      type: String,
      default: '',  // ngôn ngữ mặt trước (từ cần học), ví dụ: 'ko', 'ja'
    },
    backLanguage: {
      type: String,
      default: 'vi', // ngôn ngữ mặt sau (nghĩa), mặc định tiếng Việt
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