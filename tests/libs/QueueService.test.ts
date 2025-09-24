/**
 * @file QueueService.test.ts
 * @description A comprehensive test suite for the `QueueService` class.
 * This suite verifies the core asynchronous behavior of the queue, including
 * successful job processing, retry logic for failures, concurrency limits,
 * and the ability to pause and resume. It uses Jest's mocking and timer
 * control features to provide a reliable and isolated testing environment.
 */

/**
 * @description Imports the `QueueService` class, which is the subject of these tests.
 */
import { QueueService } from '../../src/libs/QueueService';

/**
 * @description Imports the `Processor` type for correctly typing the mock function.
 */
import { type Processor } from '../../src/types/libs/QueueService';

/**
 * @describe The main test suite for the `QueueService` class.
 * This block contains all the test cases, organized to verify each
 * aspect of the queue's functionality.
 */
describe('QueueService', () => {
  /**
   * @type {jest.Mock<Promise<void>, [any]>}
   * @description A mock function that simulates a `Processor`. It can be configured
   * to resolve for successful jobs or reject to simulate failures, providing control
   * over the test scenarios.
   */
  let mockProcessor: jest.Mock<Promise<void>, [any]>;

  /**
   * @beforeEach
   * @description A Jest hook that runs before each test case. It initializes the
   * `mockProcessor` to a fresh, resolved state, ensuring test isolation.
   */
  beforeEach(() => {
    mockProcessor = jest.fn().mockResolvedValue(undefined);
  });

  /**
   * @afterEach
   * @description A Jest hook that runs after each test case. It restores Jest's
   * real timers, which is necessary to prevent fake timers from affecting
   * other tests in the test suite.
   */
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * @test
   * @description Verifies that a single job is processed successfully and that the
   * queue emits a "completed" event. This test confirms the basic, happy path
   * functionality of the queue.
   */
  it('should process a single job successfully and emit a "completed" event', async () => {
    const queue = new QueueService('test-queue', mockProcessor);
    const payload = { data: 'success' };

    const completionPromise = new Promise<void>((resolve) => {
      queue.on('completed', (job) => {
        expect(job.payload).toEqual(payload);
        resolve();
      });
    });

    queue.add(payload);
    queue.start();

    await completionPromise;
    expect(mockProcessor).toHaveBeenCalledWith(payload);
  });

  /**
   * @test
   * @description Verifies the queue's retry mechanism. This test ensures that
   * a failing job is re attempted the correct number of times before it is
   * finally marked as failed, with the proper "failed" event emitted.
   */
  it('should retry a failing job and then mark as failed', async () => {
    jest.useFakeTimers();
    const failureError = new Error('Processing failed');
    mockProcessor.mockRejectedValue(failureError);

    const queue = new QueueService('test-queue', mockProcessor, { maxRetries: 2, retryDelay: 500 });
    const payload = { data: 'failure' };

    const failurePromise = new Promise<void>((resolve) => {
      queue.on('failed', (job) => {
        expect(job.status).toBe('failed');
        expect(job.attempts).toBe(3); // 1 initial + 2 retries
        resolve();
      });
    });

    queue.add(payload);
    queue.start();

    await jest.runAllTimersAsync();
    await failurePromise;
    expect(mockProcessor).toHaveBeenCalledTimes(3);
  });

  /**
   * @test
   * @description Verifies that the queue correctly handles concurrency, ensuring
   * that it does not process more jobs at once than the configured concurrency limit.
   * This test uses promises and explicit signals to reliably check the number
   * of concurrent calls to the processor.
   */
  it('should handle concurrency correctly', async () => {
    // 1. Create a promise that acts as a signal for when the 3rd job starts.
    let thirdJobStartedResolver: () => void;
    const thirdJobStartedPromise = new Promise<void>((resolve) => {
      thirdJobStartedResolver = resolve;
    });

    const processingPromises: Array<{ resolve: () => void }> = [];
    const concurrentProcessor: Processor<any> = jest.fn(
      () =>
        new Promise((resolve) => {
          processingPromises.push({ resolve });
          // 2. When the processor is called for the 3rd time, resolve the signal promise.
          if (concurrentProcessor.mock.calls.length === 3) {
            thirdJobStartedResolver();
          }
        }),
    );

    const queue = new QueueService('test-queue', concurrentProcessor, { concurrency: 2 });

    queue.add({ id: 1 });
    queue.add({ id: 2 });
    queue.add({ id: 3 });
    queue.start();

    // Wait for the first two jobs to be picked up
    await new Promise(setImmediate);
    expect(concurrentProcessor).toHaveBeenCalledTimes(2);

    // Complete the first job, which should free up a slot
    processingPromises[0].resolve();

    // 3. Instead of guessing the timing, wait for the explicit signal.
    await thirdJobStartedPromise;

    // Now, the assertion will reliably pass.
    expect(concurrentProcessor).toHaveBeenCalledTimes(3);

    // Clean up by resolving the other jobs
    processingPromises[1].resolve();
    processingPromises[2].resolve();
  });

  /**
   * @test
   * @description Verifies that the queue does not process any new jobs when it is
   * in a paused state. By default, a new queue instance is paused.
   */
  it('should not process new jobs when paused', async () => {
    const queue = new QueueService('test-queue', mockProcessor);
    queue.add({ id: 1 });

    // Wait a moment to ensure nothing happens while paused by default
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockProcessor).not.toHaveBeenCalled();
  });

  /**
   * @test
   * @description Verifies that the queue can be correctly resumed after being paused.
   * This test ensures that jobs are held and then processed only after the `start`
   * method is called again.
   */
  it('should resume processing after being paused', async () => {
    const queue = new QueueService('test-queue', mockProcessor, { concurrency: 1 });
    queue.add({ id: 1 });
    queue.add({ id: 2 });

    const firstJobPromise = new Promise<void>((resolve) => {
      queue.on('completed', (job) => {
        if (job.payload.id === 1) resolve();
      });
    });

    queue.start();
    await firstJobPromise;

    // The first job is done. Now pause.
    queue.pause();
    expect(mockProcessor).toHaveBeenCalledTimes(1);

    // Wait to ensure the second job isn't processed
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mockProcessor).toHaveBeenCalledTimes(1);

    const secondJobPromise = new Promise<void>((resolve) => {
      queue.on('completed', (job) => {
        if (job.payload.id === 2) resolve();
      });
    });

    // Resume processing
    queue.start();
    await secondJobPromise;

    expect(mockProcessor).toHaveBeenCalledTimes(2);
  });
});
