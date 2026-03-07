/**
 * healthRouter.js
 * GET /api/health → { status: "ok", ... }
 *
 * Usage in app.js:
 *   const healthRouter = require("./routes/healthRouter");
 *   app.use("/api", healthRouter);
 */

const express = require("express");
const router  = express.Router();
const mongoose = require("mongoose");

router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1 ? "connected" :
    dbState === 2 ? "connecting" :
    "disconnected";

  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: dbStatus,
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;

// ─────────────────────────────────────────────────────────────────────────────
// app.js integration — add these lines in order:
// ─────────────────────────────────────────────────────────────────────────────

/*

const express = require("express");
const cors    = require("cors");
const { applySecurityMiddleware, authLimiter } = require("./middleware/security");
const { errorHandler, notFound }               = require("./middleware/errorHandler");
const healthRouter                             = require("./routes/healthRouter");
const logger                                   = require("./utils/logger");

const app = express();

// 1. Security (helmet, rate-limit, mongo-sanitize)
applySecurityMiddleware(app);

// 2. CORS
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));

// 3. Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// 4. Health check (no auth needed)
app.use("/api", healthRouter);

// 5. Your routes
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/decks",  require("./routes/deckRoutes"));
app.use("/api/study",  require("./routes/studyRoutes"));
app.use("/api/srs",    require("./routes/srsRoutes"));
app.use("/api/quiz",   require("./routes/quizRoutes"));
// ... etc

// 6. 404 + error handler — MUST be last
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

*/
