/**
 * Simple In-Memory Cache for Serverless Environment
 * Optimized for Supabase Session Mode with limited connections
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds = 60) {
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to ms
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds || this.defaultTTL / 1000) * 1000;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear specific key
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get or set cache value
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }
}

// Export singleton instance with 60s default TTL
export const memoryCache = new MemoryCache(60);

// Predefined cache TTLs
export const CACHE_TTL = {
  SITE_CONFIG: 300, // 5 minutes
  PRODUCTS: 120, // 2 minutes
  CATEGORIES: 300, // 5 minutes
  USER: 30, // 30 seconds
};

// Helper to wrap Prisma queries with cache
export async function queryWithCache<T>(key: string, queryFn: () => Promise<T>, ttlSeconds: number = 60): Promise<T> {
  return memoryCache.getOrSet(key, queryFn, ttlSeconds);
}
