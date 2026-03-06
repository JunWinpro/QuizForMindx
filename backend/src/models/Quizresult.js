const mongoose = require('mongoose');

// Sub-schema cho các câu trả lời sai
const WrongCardSchema = new mongoose.Schema(
  {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    front: { type: String, required: true },
    back: { type: String, required: true },
    selectedAnswer: { type: String, required: true }, // Đáp án user chọn (sai)
    correctAnswer: { type: String, required: true },  // Đáp án đúng
  },
  { _id: false }
);

const QuizResultSchema = new mongoose.Schema(
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
    deckName: {
      type: String,
      required: true,
      default: '',
    },
    score: {
      type: Number,   // Tỉ lệ % (0–100)
      required: true,
      min: 0,
      max: 100,
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    wrongCards: {
      type: [WrongCardSchema],
      default: [],
    },
    duration: {
      type: Number,   // giây
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index: query lịch sử theo user, sort mới nhất trước
QuizResultSchema.index({ userId: 1, createdAt: -1 });

// Index: filter theo deck
QuizResultSchema.index({ userId: 1, deckId: 1, createdAt: -1 });

module.exports = mongoose.model('QuizResult', QuizResultSchema);