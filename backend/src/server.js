const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger'); // NEW

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {

      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {

    logger.error('❌ Server failed to start', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();