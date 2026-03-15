require("dotenv").config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Load passport strategy
require('./config/passport');
const passport = require('passport');
const audioRoutes = require('./routes/audio.routes');
const { applySecurityMiddleware, authLimiter } = require('./middlewares/security');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const healthRouter = require('./routes/healthRouter');

const deckRoutes      = require('./routes/deck.routes');
const authRoutes      = require('./routes/auth.routes');
const studyRoutes     = require('./routes/study.routes');
const srsRoutes       = require('./routes/srs.routes');
const quizRoutes      = require('./routes/Quiz.routes');
const statsRoutes     = require('./routes/stats.routes');
const savedDeckRoutes = require('./routes/savedDeck.routes');

// ─── Kết nối MongoDB (cần thiết cho Vercel serverless) ──────────────────────
const connectDB = require('./config/db');
let dbConnected = false;
const ensureDB = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
};
ensureDB().catch((err) => console.error('MongoDB connect error:', err.message));

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://quizformindx.web.app",
  "https://quizformindx.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.EXTRA_CORS_ORIGINS
    ? process.env.EXTRA_CORS_ORIGINS.split(",").map((o) => o.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight
app.options("*", cors());

// ─── Middleware ──────────────────────────────────────────────────────────────
applySecurityMiddleware(app);
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/audio', audioRoutes);
app.use('/audio', express.static('uploads/audio'));
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/srs',   srsRoutes);
app.use('/api/quiz',  quizRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/saved-decks', savedDeckRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;