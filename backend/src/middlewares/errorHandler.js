/**
 * errorHandler.js
 * Global Express error handling middleware.
 *
 * Usage — add LAST in app.js after all routes:
 *   const { errorHandler, notFound } = require("./middleware/errorHandler");
 *   app.use(notFound);
 *   app.use(errorHandler);
 */

const logger = require("../utils/logger");

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler — for unmatched routes
// ─────────────────────────────────────────────────────────────────────────────
function notFound(req, res, next) {
  const err = new Error(`Route không tồn tại: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler
// Standard response: { success: false, message, errors? }
// ─────────────────────────────────────────────────────────────────────────────
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.statusCode || err.status || 500;

  // Log all 5xx errors
  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${status}`, {
      error: err.message,
      stack: err.stack,
      body: req.body,
      user: req.user?._id,
    });
  } else if (status >= 400) {
    logger.warn(`${req.method} ${req.originalUrl} → ${status}: ${err.message}`);
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `Giá trị ${field} đã tồn tại`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token đã hết hạn" });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  // Default
  const message =
    process.env.NODE_ENV === "production" && status >= 500
      ? "Lỗi máy chủ nội bộ"
      : err.message || "Lỗi không xác định";

  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

module.exports = { errorHandler, notFound };
