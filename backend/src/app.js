require("dotenv").config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Load passport strategy (dotenv already loaded above)
require('./config/passport'); // khởi tạo strategy
const passport = require('passport');
const audioRoutes = require('./routes/audio.routes');
// ===== NEW IMPORTS =====
const { applySecurityMiddleware, authLimiter } = require('./middlewares/security');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const healthRouter = require('./routes/healthRouter');
// ======================

const deckRoutes  = require('./routes/deck.routes');
const authRoutes  = require('./routes/auth.routes');
const studyRoutes = require('./routes/study.routes');
const srsRoutes   = require('./routes/srs.routes');
const quizRoutes  = require('./routes/Quiz.routes');
const statsRoutes     = require('./routes/stats.routes');
const savedDeckRoutes = require('./routes/savedDeck.routes');

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());

// ===== NEW: Security middleware (helmet, rate-limit, mongo-sanitize) =====
applySecurityMiddleware(app);
// =========================================================================

app.use(express.json());
app.use(morgan('dev'));
app.use('/api/audio', audioRoutes);
app.use('/audio', express.static('uploads/audio'));
// Passport initialization MUST happen after `app` is created and body-parsers applied
app.use(passport.initialize());

// ─── Routes ─────────────────────────────────────────────────────────────────
// ===== NEW: Health check route (riêng, không bị rate-limit) =====
app.use('/api', healthRouter);
// ================================================================

// ===== NEW: Auth routes với rate limit chặt hơn =====
app.use('/api/auth', authLimiter, authRoutes);
// ====================================================

// Các routes khác giữ nguyên
app.use('/api/decks', deckRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/srs',   srsRoutes);
app.use('/api/quiz',  quizRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/saved-decks', savedDeckRoutes);

// ─── 404 handler ────────────────────────────────────────────────────────────
// ===== THAY THẾ bằng notFound middleware =====
app.use(notFound);
// =============================================

// ─── Global error handler ───────────────────────────────────────────────────
// ===== THAY THẾ bằng errorHandler middleware =====
app.use(errorHandler);
// =================================================
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);

module.exports = app;