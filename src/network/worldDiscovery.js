const redis = require('redis');
const config = require('../config');

/**
 * World Discovery Client
 * Fetches available game worlds from Redis (same instance as game servers use)
 */
class WorldDiscovery {
  constructor() {
    this.worlds = [];
    this.lastFetch = null;
    this.redisClient = null;
    this.connected = false;
  }

  /**
   * Connect to Redis
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) {
      return;
    }

    try {
      this.redisClient = redis.createClient({
        url: config.redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.error('Redis connection failed after 3 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
        this.connected = false;
      });

      this.redisClient.on('connect', () => {
        console.warn('Connected to Redis for world discovery');
        this.connected = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }

  /**
   * Fetch available worlds from Redis
   * Queries Redis for all keys matching 'world:*' pattern
   * @returns {Promise<Array>} List of available worlds
   */
  async fetchWorlds() {
    try {
      // Connect to Redis if not connected
      if (!this.connected) {
        await this.connect();
      }

      // Get all world keys (pattern: world:*)
      const keys = await this.redisClient.keys('world:*');

      if (keys.length === 0) {
        console.warn('No worlds found in Redis');
        this.worlds = [];
        return this.worlds;
      }

      // Fetch world info for each key
      const worldPromises = keys
        .filter((key) => key.split(':').length === 2) // Only include main keys like world:id, exclude sub-keys like world:id:players
        .map(async (key) => {
          const worldData = await this.redisClient.get(key);
          if (worldData) {
            try {
              return JSON.parse(worldData);
            } catch (parseError) {
              console.error(`Failed to parse world data for ${key}:`, parseError.message);
              return null;
            }
          }
          return null;
        });

      const worlds = (await Promise.all(worldPromises)).filter((w) => w !== null);

      this.worlds = worlds;
      this.lastFetch = Date.now();

      console.warn(`Discovered ${this.worlds.length} world(s) from Redis`);
      return this.worlds;
    } catch (error) {
      console.error('World discovery error:', error.message);

      // Return empty array if discovery fails
      this.worlds = [];
      return this.worlds;
    }
  }

  /**
   * Get cached worlds (if fetched recently)
   * @returns {Array} Cached worlds
   */
  getCachedWorlds() {
    return this.worlds;
  }

  /**
   * Get connection URL for a specific world
   * @param {string} worldId World ID
   * @returns {string|null} Connection URL or null if world not found
   */
  getWorldUrl(worldId) {
    const world = this.worlds.find((w) => w.worldId === worldId);
    if (!world) {
      console.error(`World ${worldId} not found`);
      return null;
    }

    // Construct full URL from host and port
    let url = world.host;

    // Add protocol if not present
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('ws://')) {
      url = `http://${url}`;
    }

    // Add port if provided and not already in URL
    if (world.port && !url.includes(':',url.indexOf('//') + 2)) {
      url = `${url}:${world.port}`;
    }

    return url;
  }
}

module.exports = new WorldDiscovery();
