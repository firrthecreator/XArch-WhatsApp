/**
 * @file CacheService.test.ts
 * @description A comprehensive test suite for the `CacheService` class.
 * This suite verifies the behavior of the service's methods by mocking the
 * underlying `node-cache` library. The tests ensure that the `CacheService`
 * correctly interacts with the cache instance and provides the expected
 * return values and side effects.
 */

/**
 * @description Imports the `CacheService` class, which is the subject of these tests.
 * This import also triggers the static initialization of the cache instance.
 */
import { CacheService } from '../../src/libs/CacheService';

/**
 * @description Imports the `NodeCache` class. This is the module that will be
 * completely mocked for testing purposes.
 */
import NodeCache from 'node-cache';

/**
 * @description This is the core mocking instruction for the entire suite.
 * It replaces the `node-cache` module with a Jest mock, so that all calls to
 * `new NodeCache()` will create a mocked instance instead of a real one.
 */
jest.mock('node-cache');

/**
 * @description Casts the mocked `NodeCache` constructor to a Jest mock for
 * easy access to its internal state, such as the created instances.
 */
const MockNodeCache = NodeCache as unknown as jest.Mock;

/**
 * @description Retrieves the single instance of the mocked `NodeCache` that was
 * created when `CacheService` was imported. Because `CacheService` is a
 * singleton, only one instance will exist, making this a reliable reference for all tests.
 */
const mockCacheInstance = MockNodeCache.mock.instances[0];

/**
 * @describe The main test suite for the `CacheService` class.
 * This block contains all the test cases, organized into nested suites
 * for logical grouping of related functionalities.
 */
describe('CacheService', () => {
  /**
   * @beforeEach
   * @description A Jest hook that runs before each test case. Its purpose is to
   * clear the call history of all mocked methods on the single cache instance.
   * This ensures that each test runs with a fresh state, without having to
   * recreate the entire `CacheService` singleton.
   */
  beforeEach(() => {
    // This resets spies on every method of the mock instance.
    Object.values(mockCacheInstance).forEach((mockFn) => {
      if (typeof mockFn === 'function' && '_isMockFunction' in mockFn) {
        (mockFn as unknown as jest.Mock).mockClear();
      }
    });
  });

  /**
   * @test
   * @description Verifies that the `set` method correctly calls the underlying
   * cache's `set` method with only two arguments when no TTL is provided.
   */
  it('should set a value in the cache without a TTL', () => {
    const key = 'my-key';
    const value = { data: 'my-data' };
    mockCacheInstance.set.mockReturnValue(true);

    const result = CacheService.set(key, value);

    // Simply check for the two arguments that were actually passed.
    expect(mockCacheInstance.set).toHaveBeenCalledWith(key, value);
    expect(result).toBe(true);
  });

  /**
   * @test
   * @description Verifies that the `set` method correctly calls the underlying
   * cache's `set` method with all three arguments when a TTL is provided.
   */
  it('should set a value in the cache with a TTL', () => {
    const key = 'my-key-ttl';
    const value = 'important data';
    const ttl = 3600;
    mockCacheInstance.set.mockReturnValue(true);

    const result = CacheService.set(key, value, ttl);

    expect(mockCacheInstance.set).toHaveBeenCalledWith(key, value, ttl);
    expect(result).toBe(true);
  });

  /**
   * @test
   * @description Verifies that the `get` method correctly calls the underlying
   * cache's `get` method and returns the value provided by the mock.
   */
  it('should get a value from the cache', () => {
    const key = 'get-key';
    const expectedValue = { id: 1, name: 'Test' };
    mockCacheInstance.get.mockReturnValue(expectedValue);

    const value = CacheService.get(key);

    expect(mockCacheInstance.get).toHaveBeenCalledWith(key);
    expect(value).toEqual(expectedValue);
  });

  /**
   * @test
   * @description Verifies that the `del` method correctly calls the underlying
   * cache's `del` method and returns the number of keys deleted.
   */
  it('should delete a single key', () => {
    const key = 'delete-key';
    mockCacheInstance.del.mockReturnValue(1);

    const result = CacheService.del(key);

    expect(mockCacheInstance.del).toHaveBeenCalledWith(key);
    expect(result).toBe(1);
  });

  /**
   * @test
   * @description Verifies that the `take` method correctly calls the underlying
   * cache's `take` method and returns the value provided by the mock.
   */
  it('should take a value', () => {
    const key = 'take-key';
    const expectedValue = 'one-time-code';
    mockCacheInstance.take.mockReturnValue(expectedValue);

    const value = CacheService.take(key);

    expect(mockCacheInstance.take).toHaveBeenCalledWith(key);
    expect(value).toEqual(expectedValue);
  });

  /**
   * @test
   * @description Verifies that the `has` method correctly calls the underlying
   * cache's `has` method and returns the boolean value provided by the mock.
   */
  it('should check if a key exists', () => {
    const key = 'has-key';
    mockCacheInstance.has.mockReturnValue(true);

    const result = CacheService.has(key);

    expect(mockCacheInstance.has).toHaveBeenCalledWith(key);
    expect(result).toBe(true);
  });

  /**
   * @test
   * @description Verifies that the `flush` method correctly calls the underlying
   * cache's `flushAll` method exactly once to clear the cache.
   */
  it('should flush the entire cache', () => {
    CacheService.flush();
    expect(mockCacheInstance.flushAll).toHaveBeenCalledTimes(1);
  });

  /**
   * @test
   * @description Verifies that the `getStats` method correctly calls the underlying
   * cache's `getStats` method and returns the statistics object provided by the mock.
   */
  it('should get cache statistics', () => {
    const stats = { hits: 100, misses: 25, keys: 50, ksize: 1024, vsize: 4096 };
    mockCacheInstance.getStats.mockReturnValue(stats);

    const result = CacheService.getStats();

    expect(mockCacheInstance.getStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual(stats);
  });
});
