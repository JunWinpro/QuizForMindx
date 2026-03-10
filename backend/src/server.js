// ✅ Error handlers PHẢI đăng ký TRƯỚC KHI require bất cứ thứ gì
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err?.message || err);
  console.error(err?.stack);
  process.exit(1);
});

require('dotenv').config();

console.log('📦 Loading modules...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);

let app, connectDB, logger;

try {
  app = require('./app');
  console.log('✅ app.js loaded');
  connectDB = require('./config/db');
  console.log('✅ db.js loaded');
  logger = require('./utils/logger');
  console.log('✅ logger.js loaded');
} catch (err) {
  console.error('❌ Failed to load module:', err.message);
  console.error(err.stack);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();