const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// ===== NEW IMPORTS =====
const { applySecurityMiddleware, authLimiter } = require('./middlewares/security');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const healthRouter = require('./routes/healthRouter');
// ======================

const deckRoutes  = require('./routes/deck.routes');
const authRoutes  = require('./routes/Auth.routes');
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

// ─── Health check cũ (có thể xóa hoặc giữ lại) ───────────────────────────────
// Nếu giữ lại, nó sẽ trùng với /api/health mới
// Khuyến nghị: XÓA phần này vì đã có healthRouter
// app.get('/api/health', (req, res) => {
//   res.status(200).json({ success: true, message: 'LexiLearn API is running' });
// });

// ─── 404 handler ────────────────────────────────────────────────────────────
// ===== THAY THẾ bằng notFound middleware =====
app.use(notFound);
// =============================================

// ─── Global error handler ───────────────────────────────────────────────────
// ===== THAY THẾ bằng errorHandler middleware =====
app.use(errorHandler);
// =================================================

module.exports = app;