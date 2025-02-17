import NodeCache from "node-cache";

class CacheService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 10800, checkperiod: 3600 }); // 3 hours TTL
  }

  // Set a value in cache
  set(key, value, ttl) {
    this.cache.set(key, value, ttl);
  }

  // Get a value from cache
  get(key) {
    return this.cache.get(key) || null;
  }

  // Delete a key from cache
  delete(key) {
    this.cache.del(key);
  }

  // Check if a key exists in cache
  has(key) {
    return this.cache.has(key);
  }

  // Clear all cache
  flush() {
    this.cache.flushAll();
  }
}

export default new CacheService();
