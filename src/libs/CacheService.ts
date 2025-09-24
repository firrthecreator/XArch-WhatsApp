/**
 * @file CacheService.ts
 * @description A simple, static, in-memory caching utility class that acts as a
 * singleton wrapper around the `node-cache` library. This service provides a
 * centralized and easy to use interface for common caching operations like
 * get, set, delete, and flush, abstracting the underlying cache implementation.
 * It is designed for high performance and is ideal for caching frequently
 * accessed data to reduce database load or expensive computations.
 *
 * @example
 * ```typescript
 * // Set a value with a 10-minute TTL
 * CacheService.set('user:123', { name: 'John Doe', role: 'admin' }, 600);
 *
 * // Retrieve the value
 * const user = CacheService.get<{ name: string; role: string }>('user:123');
 *
 * // Check if a key exists
 * if (CacheService.has('user:123')) {
 * // ...
 * }
 *
 * // Delete the key
 * CacheService.del('user:123');
 * ```
 */

/**
 * @description Imports the `NodeCache` class, which is the underlying library
 * used for the in memory cache implementation. This library provides the core
 * functionality for storing, retrieving, and managing cached data.
 */
import NodeCache from 'node-cache';

/**
 * @description Imports the `ICacheStats` type from a local file. This type
 * defines the structure for the statistics object returned by the `getStats` method,
 * ensuring type safety and clarity for the cache's performance metrics.
 */
import { type ICacheStats } from '../types/libs/CacheService';

/**
 * @class CacheService
 * @description A simple, static, in memory caching utility class that acts as a
 * singleton wrapper around the `node-cache` library. This service provides a
 * centralized and easy to use interface for common caching operations like
 * get, set, delete, and flush, abstracting the underlying cache implementation.
 * It is designed for high performance and is ideal for caching frequently
 * accessed data to reduce database load or expensive computations.
 */
export class CacheService {
  /**
   * @private
   * @static
   * @readonly
   * @property {NodeCache} cache
   * @description The single, underlying instance of `node-cache`. This instance
   * is initialized with `stdTTL: 0`, which means keys do not expire by default.
   * `useClones: false` is set for better performance, as it avoids cloning data
   * on reads and writes.
   */
  private static readonly cache = new NodeCache({ stdTTL: 0, useClones: false });

  /**
   * @description Retrieves a value from the cache for a given key.
   * This is a non destructive operation that will not remove the key from the cache.
   * If the key does not exist or has expired, it will return `undefined`.
   * @public
   * @static
   * @template T The expected type of the cached value.
   * @param {string} key The unique identifier for the cache entry.
   * @returns {T | undefined} The cached value if found and not expired, otherwise `undefined`.
   */
  public static get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * @description Stores a value in the cache.
   * @public
   * @static
   * @template T The type of the value to be stored.
   * @param {string} key The unique identifier for the cache entry.
   * @param {T} value The value to store.
   * @param {number} [ttl] Optional. The time to live in seconds for this key.
   * If not provided, the key will not expire based on the default `stdTTL` of `0`.
   * @returns {boolean} `true` if the value was set successfully, otherwise `false`.
   */
  public static set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * @description Deletes one or more keys from the cache.
   * @public
   * @static
   * @param {string | string[]} keys A single key or an array of keys to delete.
   * This method can be used to remove specific items from the cache.
   * @returns {number} The number of keys that were successfully deleted.
   */
  public static del(keys: string | string[]): number {
    return this.cache.del(keys);
  }

  /**
   * @description Retrieves a value for a key and then deletes it.
   * This is useful for one time use data like verification codes or session tokens,
   * where the data should only be consumed once.
   * @public
   * @static
   * @template T The expected type of the cached value.
   * @param {string} key The unique identifier for the cache entry.
   * @returns {T | undefined} The value if it existed, otherwise `undefined`.
   */
  public static take<T>(key: string): T | undefined {
    return this.cache.take<T>(key);
  }

  /**
   * @description Checks if a key exists in the cache.
   * This method is a fast way to check for the presence of a key without
   * retrieving its value.
   * @public
   * @static
   * @param {string} key The key to check.
   * @returns {boolean} `true` if the key exists, otherwise `false`.
   */
  public static has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * @description Clears the entire cache, deleting all keys and their associated values.
   * This is a complete reset of the cache instance.
   * @public
   * @static
   */
  public static flush(): void {
    this.cache.flushAll();
  }

  /**
   * @description Retrieves performance and usage statistics from the cache.
   * This provides useful metrics such as hits, misses, key count, and memory usage.
   * @public
   * @static
   * @returns {ICacheStats} An object containing cache statistics.
   */
  public static getStats(): ICacheStats {
    return this.cache.getStats();
  }
}
