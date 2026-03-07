const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Optional — Google OAuth users không có passwordHash
    passwordHash: {
      type: String,
      default: null,
    },
    // Google OAuth
    googleId: {
      type: String,
      default: null,
      sparse: true,  // allow multiple nulls, unique when set
      index: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'teacher'],
      default: 'user',
    },
    settings: {
      dailyGoal: { type: Number, default: 20 },
      defaultLanguage: { type: String, default: 'en' },
      notificationsEnabled: { type: Boolean, default: false },
    },
    stats: {
      streak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastStudyDate: { type: Date, default: null },
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);