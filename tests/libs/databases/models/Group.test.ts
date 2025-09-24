/**
 * @file Group.test.ts
 * @description A comprehensive test suite for the `createGroup` factory function.
 * This file verifies that the function correctly creates a new group object with a
 * consistent and complete set of default values, conforming to the `IGroup` interface.
 */

/**
 * @description Imports the `createGroup` factory function to be tested.
 */
import { createGroup } from '../../../../src/libs/databases/models/Group';

/**
 * @description Imports the `IGroup` interface, which defines the expected structure
 * of the group object returned by the `createGroup` function.
 */
import { type IGroup, GroupRole } from '../../../../src/types/libs/databases/models/Group';

/**
 * @describe The main test suite for the `createGroup` function.
 * This block contains all the test cases that validate the creation of
 * a new group object with the correct default properties.
 */
describe('Group Factory: createGroup', () => {
  /**
   * @description A constant that holds a unique group ID for testing purposes.
   */
  const testGroupId = '12345@g.us';

  /**
   * @description A constant that holds a group name for testing purposes.
   */
  const testGroupName = 'Test Group';

  /**
   * @description A constant that holds a creator user ID for testing purposes.
   */
  const testCreatorId = '628123456789@s.whatsapp.net';

  /**
   * @description A variable to store the new group object created by the factory function.
   * This object will be used by all test cases in the suite.
   */
  let newGroup: IGroup;

  /**
   * @beforeAll
   * @description A Jest hook that runs once before any of the tests in this suite begin.
   * Its purpose is to create a single instance of the group object using `createGroup`,
   * so that all subsequent tests can assert against the same object.
   */
  beforeAll(() => {
    newGroup = createGroup(testGroupId, testGroupName, testCreatorId);
  });

  /**
   * @test
   * @description Verifies that the `createGroup` function correctly sets the `id`
   * and `name` of the group object to the values provided as arguments.
   */
  it('should create a group with the correct ID and name', () => {
    expect(newGroup.id).toBe(testGroupId);
    expect(newGroup.name).toBe(testGroupName);
  });

  /**
   * @test
   * @description Verifies that the function correctly sets the `createdBy` property
   * and that the `createdAt` property is a valid timestamp that is not in the future.
   */
  it('should set the correct creator and creation timestamp', () => {
    expect(newGroup.createdBy).toBe(testCreatorId);
    expect(newGroup.createdAt).toBeDefined();
    const createdAt = new Date(newGroup.createdAt);
    expect(createdAt.toString()).not.toBe('Invalid Date');
    expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  /**
   * @test
   * @description Verifies that the group's creator is correctly added to the `members`
   * list and is assigned the `OWNER` role, ensuring the initial group structure is correct.
   */
  it('should set the creator as the owner in members list', () => {
    const owner = newGroup.members.find((m) => m.id === testCreatorId);
    expect(owner).toBeDefined();
    expect(owner?.role).toBe(GroupRole.OWNER);
  });

  /**
   * @test
   * @description Verifies that the `isActive` flag is correctly initialized to `true`
   * for a newly created group.
   */
  it('should initialize the group as active', () => {
    expect(newGroup.isActive).toBe(true);
  });

  /**
   * @test
   * @description Verifies that all nested properties within the `settings` object
   * are correctly initialized to their expected default values.
   */
  it('should initialize with default settings', () => {
    expect(newGroup.settings.language).toBe('en');
    expect(newGroup.settings.welcomeEnabled).toBe(true);
    expect(newGroup.settings.antiLinkEnabled).toBe(false);
    expect(newGroup.settings.nsfwEnabled).toBe(false);
    expect(newGroup.settings.commandPrefix).toBeNull();
  });

  /**
   * @test
   * @description Verifies that the `bans` and `interaction` properties are
   * correctly initialized to an empty state, with no bans or disabled commands.
   */
  it('should initialize with empty bans and interactions', () => {
    expect(newGroup.bans).toEqual([]);
    expect(newGroup.interaction.lastCommandTimestamp).toBe(0);
    expect(newGroup.interaction.disabledCommands).toEqual([]);
  });

  /**
   * @test
   * @description Verifies that the `description` and `profileImageUrl` properties
   * are initialized to their default `''` and `null` values respectively.
   */
  it('should have null description and profile image by default', () => {
    expect(newGroup.description).toBe('');
    expect(newGroup.profileImageUrl).toBeNull();
  });
});
