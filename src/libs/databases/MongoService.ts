/**
 * @file MongoService.ts
 * @description A comprehensive, static utility class for interacting with a MongoDB database.
 * This service centralizes database connection management and advanced data manipulation
 * operations, leveraging the official Node.js MongoDB driver and professional error handling
 * with @hapi/boom. It provides methods for:
 * - **Connection Management**: Connecting to and disconnecting from the database.
 * - **CRUD Operations**: Full support for single and bulk operations.
 * - **Advanced Queries**: Aggregation pipelines and document counting.
 * - **Atomic Transactions**: Executing multiple operations in an all or nothing transaction.
 *
 * @example
 * ```typescript
 * // Initialize the service on application startup
 * await MongoService.connect('mongodb://localhost:27017', 'myAppDb');
 *
 * // Use the service to perform operations
 * const newUser = await MongoService.insertOne('users', { name: 'John Doe' });
 *
 * // Disconnect gracefully on shutdown
 * await MongoService.disconnect();
 * ```
 */

/**
 * @description Imports a collection of fundamental types from the official `mongodb`
 * package. These types are essential for correctly typing various database
 * operations, including querying, inserting, updating, and deleting documents.
 */
import {
  MongoClient,
  Db,
  ObjectId,
  Collection,
  Filter,
  UpdateFilter,
  FindOptions,
  InsertOneResult,
  UpdateResult,
  DeleteResult,
  WithId,
} from 'mongodb';
import Boom from '@hapi/boom';
import {
  type MongoDoc,
  type AggregationPipeline,
  type TransactionCallback,
} from '../../types/libs/databases/MongoService'; // Adjust path if needed

/**
 * @class MongoService
 * @description A comprehensive, static utility class for interacting with a MongoDB database.
 * This service centralizes database connection management and advanced data manipulation
 * operations, leveraging the official Node.js MongoDB driver and professional error handling
 * with @hapi/boom. It provides methods for:
 * - **Connection Management**: Connecting to and disconnecting from the database.
 * - **CRUD Operations**: Full support for single and bulk operations.
 * - **Advanced Queries**: Aggregation pipelines and document counting.
 * - **Atomic Transactions**: Executing multiple operations in an all or nothing transaction.
 */
export class MongoService {
  /**
   * @private
   * @static
   * @type {MongoClient | null}
   * @description A private static property to hold the single instance of the
   * MongoDB client. It is initialized to `null` and populated upon successful connection.
   */
  private static client: MongoClient | null = null;

  /**
   * @private
   * @static
   * @type {Db | null}
   * @description A private static property to hold the single instance of the
   * MongoDB database. It is derived from the client and used for all database operations.
   */
  private static db: Db | null = null;

  /**
   * @description Provides the current connection status of the service.
   * @public
   * @static
   * @category Connection
   * @returns {boolean} True if the service is actively connected to the database, otherwise it returns false.
   * @example
   * ```typescript
   * if (MongoService.isConnected()) {
   * console.log('Database connection is active.');
   * }
   * ```
   */
  public static isConnected(): boolean {
    return !!this.client && !!this.db;
  }

  /**
   * @description Establishes a connection to the MongoDB server. If a connection
   * is already active, it will be disconnected first to ensure a fresh session.
   * @public
   * @static
   * @async
   * @category Connection
   * @param {string} uri The MongoDB connection string (e.g., 'mongodb://localhost:27017').
   * @param {string} dbName The name of the database to use.
   * @returns {Promise<void>} A promise that resolves when the connection is successful.
   * @throws {Boom<any>} Throws a Boom.internal error if the connection fails for any reason.
   */
  public static async connect(uri: string, dbName: string): Promise<void> {
    if (this.isConnected()) {
      await this.disconnect();
    }

    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
    } catch (error: any) {
      this.client = null;
      this.db = null;
      throw Boom.internal('Failed to establish MongoDB connection', { originalError: error });
    }
  }

  /**
   * @description Closes the active MongoDB connection and resets the service's state.
   * This should be called during a graceful application shutdown to release resources.
   * @public
   * @static
   * @async
   * @category Connection
   * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
   */
  public static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  /**
   * @description Retrieves a specific collection instance from the connected database,
   * providing a typed interface for database operations.
   * @public
   * @static
   * @category Connection
   * @template T A generic type extending MongoDoc for type safe collection operations.
   * @param {string} name The name of the collection to retrieve.
   * @returns {Collection<T>} The requested collection instance.
   * @throws {Boom<any>} Throws a Boom.serverUnavailable error if the service is not connected to a database.
   */
  public static getCollection<T extends MongoDoc>(name: string): Collection<T> {
    this._ensureConnected();
    return this.db!.collection<T>(name);
  }

  /**
   * @description Inserts a single document into a specified collection.
   * @public
   * @static
   * @async
   * @category Write
   * @template T The type of the document to be inserted.
   * @param {string} collectionName The name of the target collection.
   * @param {T} doc The document to insert.
   * @returns {Promise<InsertOneResult<T>>} A promise resolving with the insertion result,
   * which includes the ID of the newly created document.
   * @example
   * ```typescript
   * const result = await MongoService.insertOne('users', { name: 'Jane Doe', role: 'user' });
   * console.log(`New user created with ID: ${result.insertedId}`);
   * ```
   */
  public static async insertOne<T extends MongoDoc>(
    collectionName: string,
    doc: T,
  ): Promise<InsertOneResult<T>> {
    const collection = this.getCollection<T>(collectionName);
    return collection.insertOne(doc as any);
  }

  /**
   * @description Updates a single document that matches the filter criteria.
   * @public
   * @static
   * @async
   * @category Write
   * @template T The type of the document to be updated.
   * @param {string} collectionName The name of the target collection.
   * @param {Filter<T>} filter The criteria to select the document to update.
   * @param {UpdateFilter<T> | Partial<T>} update The modification to apply (e.g., using `$set`).
   * @returns {Promise<UpdateResult>} A promise resolving with the update result.
   * @throws {Boom<any>} Throws a Boom.notFound error if no document is found that matches the filter.
   */
  public static async updateOne<T extends MongoDoc>(
    collectionName: string,
    filter: Filter<T>,
    update: UpdateFilter<T> | Partial<T>,
  ): Promise<UpdateResult> {
    const collection = this.getCollection<T>(collectionName);
    const result = await collection.updateOne(filter, update);
    if (result.matchedCount === 0) {
      throw Boom.notFound(`No document found in '${collectionName}' matching the filter.`);
    }
    return result;
  }

  /**
   * @description Deletes a single document that matches the filter criteria.
   * @public
   * @static
   * @async
   * @category Write
   * @template T The type of the document to be deleted.
   * @param {string} collectionName The name of the target collection.
   * @param {Filter<T>} filter The criteria to select the document to delete.
   * @returns {Promise<DeleteResult>} A promise resolving with the deletion result.
   * @throws {Boom<any>} Throws a Boom.notFound error if no document was deleted.
   */
  public static async deleteOne<T extends MongoDoc>(
    collectionName: string,
    filter: Filter<T>,
  ): Promise<DeleteResult> {
    const collection = this.getCollection<T>(collectionName);
    const result = await collection.deleteOne(filter);
    if (result.deletedCount === 0) {
      throw Boom.notFound(`No document to delete in '${collectionName}' matching the filter.`);
    }
    return result;
  }

  /**
   * @description Finds a single document by its `_id`.
   * @public
   * @static
   * @async
   * @category Read
   * @template T The type of the document to find.
   * @param {string} collectionName The name of the target collection.
   * @param {string | ObjectId} id The document's ID as a string or an ObjectId instance.
   * @returns {Promise<WithId<T>>} A promise resolving with the found document.
   * @throws {Boom<any>} Throws Boom.badRequest for an invalid ID format or Boom.notFound if the document isn't found.
   */
  public static async findById<T extends MongoDoc>(
    collectionName: string,
    id: string | ObjectId,
  ): Promise<WithId<T>> {
    let objectId: ObjectId;
    try {
      objectId = typeof id === 'string' ? new ObjectId(id) : id;
    } catch {
      throw Boom.badRequest('Invalid ObjectId format.');
    }

    const collection = this.getCollection<T>(collectionName);
    const filter = { _id: objectId } as Filter<T>;
    const document = await collection.findOne(filter);

    if (!document) {
      throw Boom.notFound(`Document with ID '${id}' not found in '${collectionName}'.`);
    }
    return document;
  }

  /**
   * @description Finds all documents in a collection that match the provided filter.
   * @public
   * @static
   * @async
   * @category Read
   * @template T The type of the documents to find.
   * @param {string} collectionName The name of the target collection.
   * @param {Filter<T>} filter The query criteria. Use `{}` to match all documents.
   * @param {FindOptions} [options] Optional settings for the query (e.g., sort, projection, limit).
   * @returns {Promise<WithId<T>[]>} A promise that resolves with an array of found documents.
   */
  public static async find<T extends MongoDoc>(
    collectionName: string,
    filter: Filter<T>,
    options?: FindOptions,
  ): Promise<WithId<T>[]> {
    const collection = this.getCollection<T>(collectionName);
    return collection.find(filter, options).toArray();
  }

  /**
   * @description Executes an aggregation pipeline against a collection.
   * @public
   * @static
   * @async
   * @category Advanced
   * @template T The type of the documents to return after aggregation.
   * @param {string} collectionName The name of the target collection.
   * @param {AggregationPipeline} pipeline An array of aggregation stages.
   * @returns {Promise<T[]>} An array of documents resulting from the aggregation pipeline.
   * @example
   * ```typescript
   * const pipeline = [
   * { $match: { role: 'admin' } },
   * { $count: 'adminCount' }
   * ];
   * const result = await MongoService.aggregate('users', pipeline);
   * // result: [{ adminCount: 5 }]
   * ```
   */
  public static async aggregate<T extends MongoDoc>(
    collectionName: string,
    pipeline: AggregationPipeline,
  ): Promise<T[]> {
    const collection = this.getCollection(collectionName);
    return collection.aggregate<T>(pipeline).toArray();
  }

  /**
   * @description Executes a series of operations within a single, atomic transaction.
   * If any operation within the callback fails, all previous operations in the
   * transaction are rolled back.
   * @public
   * @static
   * @async
   * @category Advanced
   * @template T The value returned by the transaction callback.
   * @param {TransactionCallback<T>} callback An async function containing the database
   * operations to be executed. It receives the session as an argument, which must be
   * passed to every operation within the transaction.
   * @returns {Promise<T>} The value returned by the callback function.
   * @throws {Boom<any>} Throws a Boom.internal error if the transaction fails for any reason.
   * @example
   * ```typescript
   * const transferAmount = 100;
   * await MongoService.executeTransaction(async (session) => {
   * await MongoService.getCollection('accounts').updateOne(
   * { name: 'Alice' },
   * { $inc: { balance: -transferAmount } },
   * { session }
   * );
   * await MongoService.getCollection('accounts').updateOne(
   * { name: 'Bob' },
   * { $inc: { balance: transferAmount } },
   * { session }
   * );
   * });
   * ```
   */
  public static async executeTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    this._ensureConnected();
    const session = this.client!.startSession();

    try {
      return await session.withTransaction(async (sessionWithTransaction) =>
        callback(sessionWithTransaction),
      );
    } catch (error: any) {
      throw Boom.internal('MongoDB transaction failed', { originalError: error });
    } finally {
      await session.endSession();
    }
  }

  /**
   * @description A private helper to ensure a database connection is active before
   * attempting any database operations.
   * @private
   * @static
   * @throws {Boom<any>} If `connect()` has not been successfully called, it will throw a server unavailable error.
   */
  private static _ensureConnected(): void {
    if (!this.isConnected()) {
      throw Boom.serverUnavailable('Database service not connected. Please call connect() first.');
    }
  }
}
