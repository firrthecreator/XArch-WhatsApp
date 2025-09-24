/**
 * @file User.test.ts
 * @description Test suite for the `createUser` factory function. This file
 * verifies that the function correctly creates a new user object with a
 * consistent and complete set of default values, conforming to the `IUser` interface.
 */

/**
 * @description Imports the `createUser` factory function to be tested.
 */
import { createUser } from '../../../../src/libs/databases/models/User';

/**
 * @description Imports the `IUser` interface, which defines the expected structure
 * of the user object returned by the `createUser` function.
 */
import { type IUser } from '../../../../src/types/libs/databases/models/User';

/**
 * @describe The main test suite for the `createUser` function.
 * This block contains all the test cases that validate the creation of
 * a new user object with the correct default properties.
 */
describe('User Factory: createUser', () => {
  /**
   * @description A constant that holds a unique user ID for testing purposes.
   */
  const testUserId = 'test-user-123';

  /**
   * @description A variable to store the new user object created by the factory function.
   * This object will be used by all test cases in the suite.
   */
  let newUser: IUser;

  /**
   * @beforeAll
   * @description A Jest hook that runs once before any of the tests in this suite begin.
   * Its purpose is to create a single instance of the user object using `createUser`,
   * so that all subsequent tests can assert against the same object.
   */
  beforeAll(() => {
    newUser = createUser(testUserId);
  });

  /**
   * @test
   * @description Verifies that the `createUser` function correctly sets the `id`
   * of the user object to the value provided as an argument.
   */
  it('should create a user with the correct ID', () => {
    expect(newUser.id).toBe(testUserId);
  });

  /**
   * @test
   * @description Verifies that the `createdAt` property within the profile is a
   * valid timestamp. It checks that the property is defined, can be converted
   * to a valid `Date` object, and is not a future timestamp.
   */
  it('should have a valid creation timestamp', () => {
    expect(newUser.profile.createdAt).toBeDefined();
    const creationDate = new Date(newUser.profile.createdAt);
    expect(creationDate.toString()).not.toBe('Invalid Date');
    expect(creationDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  /**
   * @test
   * @description Verifies a set of default values for the user's profile and settings.
   * This ensures that new user accounts are initialized with a consistent base state.
   */
  it('should have correct default profile and settings values', () => {
    expect(newUser.profile.username).toBe('');
    expect(newUser.profile.gender).toBe('undisclosed');
    expect(newUser.settings.language).toBe('en');
    expect(newUser.settings.isVerified).toBe(false);
  });

  /**
   * @test
   * @description Verifies the default values for the user's economic and inventory data.
   * It checks that monetary balances, levels, and item lists are all initialized to zero or an empty array.
   */
  it('should have correct default economy and inventory values', () => {
    expect(newUser.economy.balance.money).toBe(0);
    expect(newUser.economy.balance.fiat).toBe(0);
    expect(newUser.economy.level).toBe(1);
    expect(newUser.inventory.money).toBe(0);
    expect(newUser.inventory.food.items).toEqual([]);
  });

  /**
   * @test
   * @description Verifies the default values for the user's relationship related properties.
   * It checks that partner information, status, and relationship history are all
   * initialized to a neutral or empty state.
   */
  it('should have correct default relationship values', () => {
    expect(newUser.relationship.partnerInfo).toBeNull();
    expect(newUser.relationship.status).toBe('single');
    expect(newUser.relationship.children).toEqual([]);
  });

  /**
   * @test
   * @description Verifies the default values for the user's profile customization properties.
   * It checks that all owned and active customization items are correctly initialized.
   */
  it('should have correct default customization values', () => {
    expect(newUser.customization.borders.active).toBeNull();
    expect(newUser.customization.titles.owned).toEqual([]);
  });

  /**
   * @test
   * @description Verifies the default values for the user's status and social properties.
   * It ensures that status flags and social connection lists are correctly initialized.
   */
  it('should have correct default status and social values', () => {
    expect(newUser.status.afk.isActive).toBe(false);
    expect(newUser.status.ban).toBeNull();
    expect(newUser.social.connections.friends).toEqual([]);
  });
});
