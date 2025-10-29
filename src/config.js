/**
 * Client configuration
 */

// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  // Redis URL for world discovery (connects to same Redis instance as game servers)
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Update checking (production only)
  checkUpdates: process.env.NODE_ENV === 'production',

  // Debug mode
  debug: process.argv.includes('--dev') || process.env.NODE_ENV !== 'production',
};
