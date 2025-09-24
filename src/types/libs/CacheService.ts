/**
 * @file CacheService.ts
 * @description Type definitions for the cache service statistics object.
 * This file meticulously defines the expected structure of the statistics returned
 * by the cache service, significantly enhancing type safety, code readability,
 * and maintainability across all modules that interact with cache metrics.
 * It serves as a single source of truth for the shape of the cache statistics data.
 */

/**
 * @interface ICacheStats
 * @description Defines the structure of the statistics object returned by the CacheService.
 * This interface provides comprehensive insights into the cache's performance and memory usage,
 * including key metrics such as successful lookups and memory consumption.
 * @property {number} hits The number of successful cache hits.
 * This metric tracks how many times a requested item was found in the cache, indicating
 * the effectiveness of the caching strategy.
 * @property {number} misses The number of cache misses.
 * This metric tracks how many times a requested item was not found in the cache,
 * requiring a slower lookup from the original data source.
 * @property {number} keys The total number of keys currently in the cache.
 * This represents the current count of all unique items stored within the cache.
 * @property {number} ksize The total size of all keys in bytes.
 * This metric provides a measure of the memory consumed by the keys themselves.
 * @property {number} vsize The total size of all values in bytes.
 * This metric provides a measure of the memory consumed by the cached values.
 */
export interface ICacheStats {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
}
