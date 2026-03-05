const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const deckRoutes = require('./routes/deck.routes');
const authRoutes = require('./routes/Auth.routes');
const studyRoutes = require('./routes/study.routes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/study', studyRoutes);

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'LexiLearn API is running' });
});

// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || [],
  });
});

module.exports = app;