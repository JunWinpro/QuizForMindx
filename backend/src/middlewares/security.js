/**
 * security.js
 * Express security middleware: helmet, rate limiting, mongo sanitize.
 *
 * Usage in app.js / server.js:
 *   const { applySecurityMiddleware, authLimiter } = require("./middleware/security");
 *   applySecurityMiddleware(app);
 *
 *   // On auth routes specifically:
 *   app.use("/api/auth", authLimiter, authRouter);
 */

const rateLimit = require("express-rate-limit");
const helmet    = require("helmet");

// ─────────────────────────────────────────────────────────────────────────────
// General rate limit — tăng lên 300 req / 15 min / IP
// (100 quá thấp: import 100 cards + các request UI bình thường = vượt ngay)
// ─────────────────────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // ← TĂNG TỪ 100 → 300
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.",
  },
  skip: (req) => {
    // Không rate-limit health check
    if (req.path === "/api/health") return true;
    return false;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Import limiter — dành riêng cho bulk import cards
// 500 req / 15 min — đủ để import hàng loạt mà không bị chặn
// ─────────────────────────────────────────────────────────────────────────────
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,                  // ← cho phép import nhiều card
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu import. Vui lòng thử lại sau 15 phút.",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth routes rate limit — 10 req / 15 min / IP (brute-force protection)
// (tăng từ 5 → 10 để tránh bị khóa khi test/dev)
// ─────────────────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // ← tăng từ 5 → 10
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Apply all security middleware to app
// ─────────────────────────────────────────────────────────────────────────────
function applySecurityMiddleware(app) {
  // HTTP security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.cloudinary.com"],
          imgSrc:     ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc:  ["'self'"],
          styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc:    ["'self'", "https://fonts.gstatic.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // General rate limit trên tất cả routes
  app.use(generalLimiter);
}

module.exports = { applySecurityMiddleware, authLimiter, generalLimiter, importLimiter };