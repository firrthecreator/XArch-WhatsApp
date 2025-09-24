/**
 * @file QueueService.ts
 * @description A powerful, in-memory, generic queue service for processing asynchronous
 * tasks with support for concurrency, retries, and lifecycle events.
 *
 * @template T The type of the job payload.
 *
 * @example
 * ```typescript
 * // 1. Define a processor function
 * const myProcessor: Processor<{ url: string }> = async (payload) => {
 * console.log(`Fetching URL: ${payload.url}`);
 * const response = await fetch(payload.url);
 * if (!response.ok) {
 * throw new Error(`Failed to fetch ${payload.url}`);
 * }
 * console.log('Fetch successful!');
 * };
 *
 * // 2. Create and configure a new queue
 * const urlQueue = new QueueService('url-fetcher', myProcessor, {
 * concurrency: 5,
 * maxRetries: 2,
 * });
 *
 * // 3. Listen for events
 * urlQueue.on('completed', (job) => console.log(`Job ${job.id} completed.`));
 * urlQueue.on('failed', (job, error) => console.error(`Job ${job.id} failed: ${error.message}`));
 *
 * // 4. Add jobs and start the queue
 * urlQueue.add({ url: '[https://google.com](https://google.com)' });
 * urlQueue.add({ url: '[https://example.com](https://example.com)' });
 * urlQueue.start();
 * ```
 */

/**
 * @description Imports the `randomUUID` function from Node.js's built in `node:crypto`
 * module. This function is used to generate a cryptographically secure, unique
 * identifier for each job added to the queue, ensuring no two jobs have the same ID.
 */
import { randomUUID } from 'node:crypto';

/**
 * @description Imports the `EventEmitter` class from the `node:events` module.
 * This class provides a powerful, built in mechanism for event handling, allowing
 * the queue service to emit events for job lifecycle changes such as `completed`,
 * `failed`, or `retrying`.
 */
import { EventEmitter } from 'node:events';

/**
 * @description Imports local type definitions for the queue service.
 * - `IJob`: The interface defining the structure of a job object.
 * - `IQueueOptions`: The interface for configuring the queue's behavior.
 * - `Processor`: The type definition for the function that processes a job.
 */
import { type IJob, type IQueueOptions, type Processor } from '../types/libs/QueueService';

/**
 * @class QueueService<T>
 * @extends EventEmitter
 * @description A powerful, in memory, generic queue service for processing asynchronous
 * tasks with support for concurrency, retries, and lifecycle events.
 * @template T The type of the job payload, ensuring type safety for the data processed by the queue.
 */
export class QueueService<T> extends EventEmitter {
  /**
   * @public
   * @readonly
   * @property {string} name
   * @description The unique name of the queue. This is useful for debugging and
   * distinguishing between multiple queues in an application.
   */
  public readonly name: string;

  /**
   * @private
   * @readonly
   * @property {Processor<T>} processor
   * @description The function that will be executed to process each job's payload.
   * This function contains the core business logic for the queue.
   */
  private readonly processor: Processor<T>;

  /**
   * @private
   * @readonly
   * @property {Required<IQueueOptions>} options
   * @description The configuration options for the queue. This includes settings
   * for concurrency, max retries, and retry delay. The `Required` utility ensures
   * all properties have a default value.
   */
  private readonly options: Required<IQueueOptions>;

  /**
   * @private
   * @property {IJob<T>[]} queue
   * @description An array representing the list of jobs waiting to be processed.
   * New jobs are added to the end, and pending jobs are shifted from the front.
   */
  private queue: IJob<T>[] = [];

  /**
   * @private
   * @property {Set<string>} processing
   * @description A set that stores the unique IDs of all jobs currently being
   * processed. This is used to track the number of active jobs and enforce the
   * concurrency limit.
   */
  private processing = new Set<string>();

  /**
   * @private
   * @property {boolean} isPaused
   * @description A boolean flag indicating whether the queue is currently paused.
   * When `true`, no new jobs will be started.
   */
  private isPaused = true;

  /**
   * @description Creates a new instance of the queue service.
   * @param {string} name The unique name for the queue.
   * @param {Processor<T>} processor The function that processes each job.
   * @param {IQueueOptions} [options={}] Optional configuration for the queue.
   */
  constructor(name: string, processor: Processor<T>, options: IQueueOptions = {}) {
    super();
    this.name = name;
    this.processor = processor;
    this.options = {
      concurrency: options.concurrency ?? 1,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    };
  }

  /**
   * @description Adds a new job to the queue.
   * The job is immediately pushed to the back of the queue, and the queue
   * is automatically checked to see if it can start processing.
   * @public
   * @param {T} payload The data payload for the job.
   * @returns {IJob<T>} The created job object with a unique ID and initial status.
   */
  public add(payload: T): IJob<T> {
    const job: IJob<T> = {
      id: randomUUID(),
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };
    this.queue.push(job);
    this.processQueue();
    return job;
  }

  /**
   * @description Starts processing jobs from the queue.
   * This unpauses the queue and triggers the processing loop to begin.
   * This method must be called for the queue to start processing jobs.
   * @public
   */
  public start(): void {
    this.isPaused = false;
    this.processQueue();
  }

  /**
   * @description Pauses the queue, preventing new jobs from being processed.
   * Jobs that are currently being processed will continue to run to completion.
   * This is a non blocking operation.
   * @public
   */
  public pause(): void {
    this.isPaused = true;
  }

  /**
   * @private
   * @description The main processing loop for the queue.
   * This private method is responsible for taking jobs from the queue and
   * executing them, respecting the concurrency limit and the paused state.
   */
  private processQueue(): void {
    if (this.isPaused) {
      return;
    }

    /**
     * @description Continuously takes jobs from the queue as long as the concurrency limit
     * has not been reached and there are still jobs in the queue.
     * The `while` loop ensures that multiple jobs can be started in a single tick
     * if the concurrency limit allows.
     */
    while (this.processing.size < this.options.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) {
        // Execute the job without awaiting the result to allow concurrent processing.
        this.executeJob(job);
      }
    }
  }

  /**
   * @private
   * @async
   * @description Executes a single job. This method manages the entire lifecycle
   * of a job from processing to completion, failure, or retry.
   * @param {IJob<T>} job The job object to be processed.
   */
  private async executeJob(job: IJob<T>): Promise<void> {
    this.processing.add(job.id);
    job.status = 'processing';
    job.attempts += 1;

    try {
      await this.processor(job.payload);
      job.status = 'completed';
      job.processedAt = new Date();
      this.emit('completed', job);
    } catch (error: any) {
      if (job.attempts > this.options.maxRetries) {
        // Job has exceeded the maximum number of retries and is marked as permanently failed.
        job.status = 'failed';
        job.error = error.message;
        job.failedAt = new Date();
        this.emit('failed', job, error);
      } else {
        // The job is scheduled for a retry after a delay.
        this.emit('retrying', job, error);
        setTimeout(() => {
          job.status = 'pending';
          this.queue.unshift(job); // Add the job back to the front of the queue to prioritize its retry.
          this.processQueue();
        }, this.options.retryDelay);
      }
    } finally {
      // Regardless of success or failure, the job is removed from the set of currently processing jobs.
      this.processing.delete(job.id);
      // Use setImmediate to avoid deep call stacks on fast resolving jobs,
      // ensuring the queue continues to process.
      setImmediate(() => this.processQueue());
    }
  }
}
