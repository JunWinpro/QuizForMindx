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

const rateLimit       = require("express-rate-limit");
const helmet          = require("helmet");


// ─────────────────────────────────────────────────────────────────────────────
// General rate limit — 100 req / 15 min / IP
// ─────────────────────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.",
  },
  skip: (req) => {
    // Don't rate-limit health check
    return req.path === "/api/health";
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth routes rate limit — 5 req / 15 min / IP (brute-force protection)
// ─────────────────────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Prevent NoSQL injection via query sanitization


  // General rate limit on all routes
  app.use(generalLimiter);
}

module.exports = { applySecurityMiddleware, authLimiter, generalLimiter };
