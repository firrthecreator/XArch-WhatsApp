/**
 * @file MongoService.ts
 * @description This file defines and re exports core types from the official
 * MongoDB Node.js driver. It serves as a central location for custom type
 * aliases and other type definitions related to MongoDB operations, promoting
 * code consistency and readability throughout the project.
 * @see {@link https://mongodb.github.io/node-mongodb-native/6.7/index.html MongoDB Node.js Driver API}
 */

/**
 * @description Imports a collection of fundamental types from the `mongodb` package.
 * These types are essential for correctly typing various database operations,
 * including querying, inserting, updating, and deleting documents.
 */
import {
  type Document,
  type Filter,
  type UpdateFilter,
  type FindOptions,
  type InsertOneResult,
  type InsertManyResult,
  type UpdateResult,
  type DeleteResult,
  type Collection,
  type ClientSession,
  type WithId,
  type CountOptions,
  type AggregateOptions,
} from 'mongodb';

/**
 * @description Re exports a curated list of core types from the MongoDB driver.
 * This practice ensures that all parts of the application use the same type
 * definitions, preventing inconsistencies and making the code easier to maintain.
 * Some types are re exported with custom, more descriptive names.
 * @exports {Document} MongoDoc A generic document type.
 * @exports {Filter} Filter The type for a MongoDB query filter.
 * @exports {UpdateFilter} UpdateFilter The type for an update operation.
 * @exports {FindOptions} FindOptions The type for find operation options.
 * @exports {InsertOneResult} InsertOneResult The type for a single insert result.
 * @exports {InsertManyResult} InsertManyResult The type for a multiple insert result.
 * @exports {UpdateResult} UpdateResult The type for an update result.
 * @exports {DeleteResult} DeleteResult The type for a delete result.
 * @exports {Collection} Collection The type for a MongoDB collection.
 * @exports {ClientSession} ClientSession The type for a MongoDB client session.
 * @exports {WithId} WithId The type for documents with an auto generated ID.
 * @exports {CountOptions} CountOptions The type for count operation options.
 * @exports {AggregateOptions} AggregateOptions The type for aggregate operation options.
 */
export type {
  Document as MongoDoc,
  Filter,
  UpdateFilter,
  FindOptions,
  InsertOneResult,
  InsertManyResult,
  UpdateResult,
  DeleteResult,
  Collection,
  ClientSession,
  WithId,
  CountOptions,
  AggregateOptions,
};

/**
 * @type AggregationPipeline
 * @description Defines the shape of a MongoDB aggregation pipeline, which is
 * an array of pipeline stage documents. Each document in the array represents
 * a specific stage in the data processing flow.
 */
export type AggregationPipeline = Document[];

/**
 * @type TransactionCallback
 * @description Defines the signature of the callback function to be executed
 * within a database transaction. This function receives a `ClientSession`
 * and performs a series of operations that must be atomic.
 * @template T The data type that the transaction callback will return upon completion.
 * @param {ClientSession} session The client session that must be passed to every
 * database operation within the transaction to ensure they are part of the same unit of work.
 * @returns {Promise<T>} A promise that resolves with the result of the transaction callback.
 */
export type TransactionCallback<T> = (session: ClientSession) => Promise<T>;
