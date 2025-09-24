/**
 * @file QueueService.ts
 * @description Type definitions for the `QueueService` module. This file defines the core
 * interfaces and types that shape the queue's data structures and behavior, ensuring
 * consistency and type safety across the entire queue system.
 */

/**
 * @interface IJob<T>
 * @description Represents a single unit of work within the queue. It contains the
 * data payload and metadata for tracking its lifecycle.
 * @template T The type of the payload data.
 */
export interface IJob<T> {
  /** A unique identifier for the job. */
  id: string;
  /** The data payload that the processor function will receive. */
  payload: T;
  /** The current status of the job in its lifecycle. */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** The number of times this job has been attempted. */
  attempts: number;
  /** The error message if the job failed after all retries. */
  error?: string;
  /** The timestamp when the job was created. */
  createdAt: Date;
  /** The timestamp when the job was successfully processed. */
  processedAt?: Date;
  /** The timestamp when the job ultimately failed. */
  failedAt?: Date;
}

/**
 * @type Processor<T>
 * @description Defines the signature for a processor function, which contains the
 * logic for how to handle a job's payload.
 * @template T The type of the payload data.
 * @param payload The data payload from the job.
 * @returns {Promise<void>} A promise that resolves on successful processing or rejects on failure.
 */
export type Processor<T> = (payload: T) => Promise<void>;

/**
 * @interface IQueueOptions
 * @description Defines the configurable options to control the behavior of the queue.
 */
export interface IQueueOptions {
  /** The number of jobs to process concurrently. Defaults to 1. */
  concurrency?: number;
  /** The maximum number of times to retry a failed job. Defaults to 3. */
  maxRetries?: number;
  /** The delay in milliseconds before retrying a failed job. Defaults to 1000. */
  retryDelay?: number;
}
