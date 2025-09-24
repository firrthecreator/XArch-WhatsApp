/**
 * @file MongoService.test.ts
 * @description Unit tests for the `MongoService` class. This file uses Jest to
 * test the functionality of the service by mocking the underlying `mongodb`
 * library. It ensures that the service methods correctly handle database
 * operations and errors, providing reliable interaction with MongoDB.
 * @see {@link https://jestjs.io/docs/mock-functions Jest Mock Functions}
 */

/**
 * @description Imports the Boom library for verifying custom error handling.
 */
import Boom from '@hapi/boom';

/**
 * @description Imports key types and classes from the `mongodb` driver.
 * These are used to create mock implementations that mimic the behavior
 * of the real MongoDB library.
 */
import { MongoClient, ObjectId } from 'mongodb';

/**
 * @description Imports the `MongoService` class that is the subject of these tests.
 */
import { MongoService } from '../../../src/libs/databases/MongoService';

/**
 * @description This section defines a series of mock functions that simulate
 * the behavior of the `mongodb` driver. Each mock corresponds to a method
 * on the real `MongoClient`, `Db`, or `Collection` objects, allowing us to
 * test `MongoService` in an isolated environment without needing a live database.
 */

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `connect` method of `MongoClient`, simulating a
 * successful or failed connection to the database.
 */
const mockConnect = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `close` method of `MongoClient`, simulating the
 * closing of a database connection.
 */
const mockClose = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `toArray` method, which is commonly chained after
 * `find` or `aggregate` operations. It simulates the conversion of a cursor to an array.
 */
const mockToArray = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `aggregate` method of a collection. It returns
 * a mock object with a `toArray` method to allow for method chaining.
 */
const mockAggregate = jest.fn(() => ({ toArray: mockToArray }));

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `find` method of a collection. It returns a mock
 * object with a `toArray` method to simulate a query returning a cursor.
 */
const mockFind = jest.fn(() => ({ toArray: mockToArray }));

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `insertOne` method of a collection.
 */
const mockInsertOne = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `insertMany` method of a collection.
 */
const mockInsertMany = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `updateOne` method of a collection.
 */
const mockUpdateOne = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `updateMany` method of a collection.
 */
const mockUpdateMany = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `deleteOne` method of a collection.
 */
const mockDeleteOne = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `deleteMany` method of a collection.
 */
const mockDeleteMany = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `findOne` method of a collection, simulating finding
 * a single document.
 */
const mockFindOne = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `countDocuments` method of a collection.
 */
const mockCountDocuments = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `collection` method of a database. This function
 * returns an object containing all the mocked collection methods.
 */
const mockCollection = jest.fn().mockReturnValue({
  insertOne: mockInsertOne,
  insertMany: mockInsertMany,
  updateOne: mockUpdateOne,
  updateMany: mockUpdateMany,
  deleteOne: mockDeleteOne,
  deleteMany: mockDeleteMany,
  findOne: mockFindOne,
  find: mockFind,
  aggregate: mockAggregate,
  countDocuments: mockCountDocuments,
});

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `db` method of `MongoClient`. It returns a mock
 * database object with a `collection` method.
 */
const mockDb = jest.fn(() => ({ collection: mockCollection }));

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `withTransaction` method of a session. It is used
 * to simulate an atomic transaction.
 */
const mockWithTransaction = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `endSession` method of a session, simulating the
 * closure of a database session.
 */
const mockEndSession = jest.fn();

/**
 * @type {jest.Mock<any, any>}
 * @description Mocks the `startSession` method of `MongoClient`. It returns a
 * mock session object with `withTransaction` and `endSession` methods.
 */
const mockStartSession = jest.fn(() => ({
  withTransaction: mockWithTransaction,
  endSession: mockEndSession,
}));

/**
 * @description This is the core mocking instruction. It overrides the real
 * `mongodb` module with our custom mock implementation. This ensures that
 * when `MongoService` imports `mongodb`, it receives our mocked methods
 * instead of the real ones, allowing for isolated unit testing.
 */
jest.mock('mongodb', () => {
  const originalMongodb = jest.requireActual('mongodb');
  return {
    ...originalMongodb,
    MongoClient: jest.fn().mockImplementation(() => ({
      connect: mockConnect,
      close: mockClose,
      db: mockDb,
      startSession: mockStartSession,
    })),
  };
});

/**
 * @description This is the main test suite for the `MongoService` class. It
 * contains nested suites for each major category of functionality: connection,
 * write operations, read operations, and advanced features like transactions.
 */
describe('MongoService', () => {
  /**
   * @description Defines a constant for the test database connection URI.
   */
  const TEST_URI = 'mongodb://test-uri';

  /**
   * @description Defines a constant for the test database name.
   */
  const TEST_DB = 'test-db';

  /**
   * @description Defines a constant for a test collection name.
   */
  const TEST_COLLECTION = 'users';

  /**
   * @description A Jest hook that runs before each individual test case.
   * It ensures that all mock functions are reset, providing test isolation
   * by clearing any call history or mock return values from previous tests.
   */
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @description A Jest hook that runs once after all test cases in this file have
   * completed. It ensures that the `MongoService` is properly disconnected,
   * cleaning up resources after the tests are finished.
   */
  afterAll(async () => {
    await MongoService.disconnect();
  });

  /**
   * @description A nested test suite for the connection related methods of `MongoService`.
   * It verifies that the service can connect, disconnect, and report its status correctly.
   */
  describe('Connection', () => {
    /**
     * @description This test verifies the entire connection lifecycle. It checks
     * that the service correctly connects, updates its status to `true`, then
     * disconnects, and finally updates its status to `false`.
     */
    it('should connect, disconnect, and check status correctly', async () => {
      mockConnect.mockResolvedValue(undefined);
      await MongoService.connect(TEST_URI, TEST_DB);
      expect(MongoService.isConnected()).toBe(true);
      await MongoService.disconnect();
      expect(MongoService.isConnected()).toBe(false);
    });

    /**
     * @description This test verifies the error handling for a failed connection.
     * It ensures that when `MongoClient.connect()` rejects, `MongoService.connect()`
     * throws a `Boom.internal` error with the original error details.
     */
    it('should throw an error if connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockConnect.mockRejectedValue(connectionError);
      await expect(MongoService.connect(TEST_URI, TEST_DB)).rejects.toThrow(
        Boom.internal('Failed to establish MongoDB connection', { originalError: connectionError }),
      );
    });

    /**
     * @description This test verifies that calling a method that requires a
     * connection without one will throw the appropriate error. It checks that
     * `getCollection()` correctly throws a `Boom.serverUnavailable` error.
     */
    it('should throw an error when a method is called without a connection', () => {
      expect(() => MongoService.getCollection(TEST_COLLECTION)).toThrow(
        Boom.serverUnavailable('Database service not connected. Please call connect() first.'),
      );
    });
  });

  /**
   * @description A nested test suite for the write operations of `MongoService`,
   * including `insertOne`, `updateOne`, and `deleteOne`. It verifies that these
   * methods correctly interact with the mocked MongoDB collection methods.
   */
  describe('Write Operations', () => {
    /**
     * @description This hook ensures that the `MongoService` is connected
     * before each write operation test runs.
     */
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined);
      await MongoService.connect(TEST_URI, TEST_DB);
    });

    /**
     * @description This test verifies that `insertOne` correctly calls the
     * mocked `insertOne` method with the provided document.
     */
    it('should call insertOne', async () => {
      const doc = { name: 'test' };
      await MongoService.insertOne(TEST_COLLECTION, doc);
      expect(mockInsertOne).toHaveBeenCalledWith(doc);
    });

    /**
     * @description This test verifies that `updateOne` correctly calls the
     * mocked `updateOne` method and handles a successful update by not throwing
     * an error.
     */
    it('should call updateOne and handle success', async () => {
      mockUpdateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
        acknowledged: true,
        upsertedId: null,
        upsertedCount: 0,
      });
      await MongoService.updateOne(TEST_COLLECTION, {}, { $set: {} });
      expect(mockUpdateOne).toHaveBeenCalled();
    });

    /**
     * @description This test verifies the error handling for `updateOne`
     * when no document is found to match the update filter. It ensures that
     * a `Boom.notFound` error is correctly thrown.
     */
    it('should throw Boom.notFound when updateOne finds no document', async () => {
      mockUpdateOne.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0,
        acknowledged: true,
        upsertedId: null,
        upsertedCount: 0,
      });
      await expect(MongoService.updateOne(TEST_COLLECTION, {}, { $set: {} })).rejects.toThrow(
        Boom.notFound(`No document found in '${TEST_COLLECTION}' matching the filter.`),
      );
    });

    /**
     * @description This test verifies that `deleteOne` correctly calls the
     * mocked `deleteOne` method and handles a successful deletion by not
     * throwing an error.
     */
    it('should call deleteOne and handle success', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 1, acknowledged: true });
      await MongoService.deleteOne(TEST_COLLECTION, {});
      expect(mockDeleteOne).toHaveBeenCalled();
    });

    /**
     * @description This test verifies the error handling for `deleteOne`
     * when no document is found to match the deletion filter. It ensures that
     * a `Boom.notFound` error is correctly thrown.
     */
    it('should throw Boom.notFound when deleteOne finds no document', async () => {
      mockDeleteOne.mockResolvedValue({ deletedCount: 0, acknowledged: true });
      await expect(MongoService.deleteOne(TEST_COLLECTION, {})).rejects.toThrow(
        Boom.notFound(`No document to delete in '${TEST_COLLECTION}' matching the filter.`),
      );
    });
  });

  /**
   * @description A nested test suite for the `find` method of `MongoService`.
   * It verifies that `find` correctly calls the mocked `find` and `toArray`
   * methods and returns the expected result.
   */
  describe('Read Operations', () => {
    /**
     * @description This hook ensures that the `MongoService` is connected
     * before each read operation test runs.
     */
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined);
      await MongoService.connect(TEST_URI, TEST_DB);
    });

    /**
     * @description This test verifies that the `find` method correctly calls
     * the mocked `find` and `toArray` functions and returns the array of documents
     * that `toArray` is configured to return.
     */
    it('should call find and return an array of documents', async () => {
      const docs = [{ name: 'User 1' }, { name: 'User 2' }];
      mockToArray.mockResolvedValue(docs);
      const result = await MongoService.find(TEST_COLLECTION, {});
      expect(mockFind).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqual(docs);
    });
  });

  /**
   * @description A nested test suite specifically for the `findById` method.
   * It verifies the correct behavior for finding documents by ID, including
   * handling valid and invalid ID formats.
   */
  describe('findById', () => {
    /**
     * @description This hook ensures that the `MongoService` is connected
     * before each `findById` test runs.
     */
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined);
      await MongoService.connect(TEST_URI, TEST_DB);
    });

    /**
     * @description This test verifies that a document can be successfully found
     * when a valid string representation of an ObjectId is provided. It checks
     * that the mock `findOne` is called with the correctly converted ObjectId.
     */
    it('should find a document with a valid string ID', async () => {
      const id = new ObjectId();
      const doc = { _id: id, name: 'test' };
      mockFindOne.mockResolvedValue(doc);
      const result = await MongoService.findById(TEST_COLLECTION, id.toHexString());
      expect(result).toEqual(doc);
      expect(mockFindOne).toHaveBeenCalledWith({ _id: id });
    });

    /**
     * @description This test verifies that a document can be successfully found
     * when a valid `ObjectId` instance is provided directly as the ID.
     */
    it('should find a document with a valid ObjectId instance', async () => {
      const id = new ObjectId();
      const doc = { _id: id, name: 'test' };
      mockFindOne.mockResolvedValue(doc);
      const result = await MongoService.findById(TEST_COLLECTION, id);
      expect(result).toEqual(doc);
      expect(mockFindOne).toHaveBeenCalledWith({ _id: id });
    });

    /**
     * @description This test verifies that a `Boom.notFound` error is thrown
     * when no document is returned by the mocked `findOne` method.
     */
    it('should throw Boom.notFound if document is not found', async () => {
      mockFindOne.mockResolvedValue(null);
      const id = new ObjectId().toHexString();
      await expect(MongoService.findById(TEST_COLLECTION, id)).rejects.toThrow(
        `Document with ID '${id}' not found in '${TEST_COLLECTION}'.`,
      );
    });

    /**
     * @description This test verifies that a `Boom.badRequest` error is thrown
     * when the provided ID string has an invalid format that cannot be converted
     * into an ObjectId.
     */
    it('should throw Boom.badRequest for an invalid ID format', async () => {
      await expect(MongoService.findById(TEST_COLLECTION, 'invalid-id-format')).rejects.toThrow(
        Boom.badRequest('Invalid ObjectId format.'),
      );
    });
  });

  /**
   * @description A nested test suite for advanced operations like transactions.
   * It verifies the correct behavior of the `executeTransaction` method.
   */
  describe('Advanced Operations', () => {
    /**
     * @description This hook ensures that the `MongoService` is connected
     * before each advanced operation test runs.
     */
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined);
      await MongoService.connect(TEST_URI, TEST_DB);
    });

    /**
     * @description This test verifies that a transaction is executed correctly.
     * It checks that the session is started, `withTransaction` is called,
     * the transaction callback is executed, and the session is finally ended.
     */
    it('should execute a transaction successfully', async () => {
      mockWithTransaction.mockImplementation(async (callback) => callback());
      const myTransaction = jest.fn().mockResolvedValue('Success');
      const result = await MongoService.executeTransaction(myTransaction);
      expect(mockStartSession).toHaveBeenCalled();
      expect(mockWithTransaction).toHaveBeenCalled();
      expect(myTransaction).toHaveBeenCalled();
      expect(mockEndSession).toHaveBeenCalled();
      expect(result).toBe('Success');
    });

    /**
     * @description This test verifies the error handling for a failed transaction.
     * It ensures that a `Boom.internal` error is thrown and that the session
     * is correctly ended even when the transaction fails.
     */
    it('should throw an error if a transaction fails', async () => {
      const txError = new Error('Transaction Failed');
      mockWithTransaction.mockRejectedValue(txError);
      const myTransaction = jest.fn();
      await expect(MongoService.executeTransaction(myTransaction)).rejects.toThrow(
        Boom.internal('MongoDB transaction failed', { originalError: txError }),
      );
      expect(mockEndSession).toHaveBeenCalled();
    });
  });
});
