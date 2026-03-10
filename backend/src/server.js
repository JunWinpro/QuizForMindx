require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Bắt lỗi không được handle — quan trọng để Render hiện lỗi thật
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

const startServer = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    console.error(error.stack);
    logger.error('❌ Server failed to start', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();