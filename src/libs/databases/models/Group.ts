/**
 * @file Group.ts
 * @description A factory function for creating new group objects with a consistent
 * and valid default schema. This utility ensures that every new group starts
 * with all necessary properties initialized to a predictable state.
 */

/**
 * @description Imports the `IGroup` interface and `GroupRole` enum, which are used to
 * define the structure and roles of a group document in the database.
 */
import { type IGroup, GroupRole } from '../../../types/libs/databases/models/Group';

/**
 * @function createGroup
 * @description A factory function that creates a new group object with a complete
 * and consistent set of default values. The function automatically initializes
 * the group creator as the first member with an 'OWNER' role, and sets
 * default configuration settings.
 * @param {string} id The unique identifier for the new group.
 * @param {string} name The name of the group.
 * @param {string} createdBy The user ID of the group's creator.
 * @returns {IGroup} A new group object conforming to the IGroup interface.
 */
export function createGroup(id: string, name: string, createdBy: string): IGroup {
  const now = new Date().toISOString();

  return {
    /** The unique identifier for the group. */
    id,
    /** The name of the group. */
    name,
    /** The ISO 8601 timestamp of when the group was created. */
    createdAt: now,
    /** The user ID of the group's creator. */
    createdBy,
    /** The group's description, which is empty by default. */
    description: '',
    /** The URL to the group's profile picture, which is null by default. */
    profileImageUrl: null,
    /** A flag indicating that the group is active upon creation. */
    isActive: true,
    /**
     * @description The list of all members in the group. Upon creation, the group
     * contains a single member, who is the creator and is automatically assigned
     * the 'OWNER' role.
     */
    members: [
      {
        id: createdBy,
        name: 'Owner',
        role: GroupRole.OWNER,
        joinedAt: now,
      },
    ],
    /** An empty array representing the list of banned users, which is empty by default. */
    bans: [],
    /**
     * @description Custom settings for the group, initialized with default values.
     */
    settings: {
      /** The default language for the bot's responses in the group. */
      language: 'en',
      /** A flag to enable welcome messages, which is active by default. */
      welcomeEnabled: true,
      /** A flag to enable the anti link feature, which is inactive by default. */
      antiLinkEnabled: false,
      /** A flag to allow NSFW content, which is inactive by default. */
      nsfwEnabled: false,
      /** The custom command prefix for the group, which is null by default. */
      commandPrefix: null,
    },
    /**
     * @description Interaction related data for the group.
     */
    interaction: {
      /** The Unix timestamp of the last command used, which is 0 by default. */
      lastCommandTimestamp: 0,
      /** A list of command names that are disabled in this group, which is empty by default. */
      disabledCommands: [],
    },
  };
}
