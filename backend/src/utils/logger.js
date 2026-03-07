/**
 * logger.js
 * Winston logger — logs errors to logs/error.log and console.
 *
 * Usage:
 *   const logger = require("./utils/logger");
 *   logger.error("Something broke", { extra: data });
 *   logger.info("Server started on port 5000");
 */

const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs   = require("fs");

// Ensure logs directory exists
const logDir = path.resolve(__dirname, "../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

// ── Custom log format ──────────────────────────────────────────────────────
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? "\n" + JSON.stringify(meta, null, 2) : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console (dev-friendly, colored)
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    // Error log file
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      tailable: true,
    }),
    // Combined log file
    new transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 3,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, "exceptions.log") }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, "rejections.log") }),
  ],
});

module.exports = logger;
