/**
 * @file Group.ts
 * @description Defines the data structure for a WhatsApp group. This file contains
 * all the necessary interfaces and an enum to represent a group document,
 * including its metadata, member roles, settings, bans, and interaction states.
 * This structured approach ensures type safety and consistency across the application.
 */

/**
 * @enum GroupRole
 * @description Defines the possible roles a member can have within a WhatsApp group.
 * This enum provides a clear, type safe way to represent and manage group permissions.
 */
export enum GroupRole {
  /** The owner of the WhatsApp group, with the highest level of permission. */
  OWNER = 'owner',
  /** An admin with elevated permissions to manage the group. */
  ADMIN = 'admin',
  /** A regular member with standard group permissions. */
  MEMBER = 'member',
}

/**
 * @interface IGroupMember
 * @description Represents a single member of a WhatsApp group. This interface
 * contains essential information for identifying the member, their role, and when they joined.
 */
export interface IGroupMember {
  /** The WhatsApp ID of the member (e.g., 628xxxx@s.whatsapp.net). */
  id: string;
  /** The display name or nickname of the member within the group. */
  name: string;
  /** The role of the member in the group, as defined by `GroupRole`. */
  role: GroupRole;
  /** The date the member joined the group in ISO 8601 format. */
  joinedAt: string;
}

/**
 * @interface IBanEntry
 * @description Represents a single ban record for a user in a group. This interface
 * provides a detailed history of a ban, including the reason and duration.
 */
export interface IBanEntry {
  /** The ID of the banned user. */
  userId: string;
  /** The reason provided for the ban. */
  reason: string;
  /** The ID of the admin who issued the ban. */
  bannedBy: string;
  /** The Unix timestamp of when the ban was applied. */
  timestamp: number;
  /** A flag indicating whether the ban is permanent. */
  isPermanent: boolean;
  /** The duration of the ban in seconds. This will be 0 for permanent bans. */
  duration: number;
}

/**
 * @interface IGroup
 * @description Full schema representing a WhatsApp group and all its associated metadata.
 * This is the root schema for a group document in the database, encompassing all
 * group related data.
 */
export interface IGroup {
  /** The unique identifier for the group, typically the WhatsApp group JID. */
  id: string;

  /** The name of the group as seen in WhatsApp. */
  name: string;

  /** The URL or path to the group's profile picture. This can be null if no picture is set. */
  profileImageUrl: string | null;

  /** The description or bio of the group. */
  description: string;

  /** The ISO 8601 timestamp of when the group was created. */
  createdAt: string;

  /** The ID of the user who created the group. */
  createdBy: string;

  /** A flag indicating whether the group is currently active or archived. */
  isActive: boolean;

  /** A list of all members in the group, represented by `IGroupMember` objects. */
  members: IGroupMember[];

  /** A list of all banned users in the group, represented by `IBanEntry` objects. */
  bans: IBanEntry[];

  /** Custom settings specific to the group. */
  settings: {
    /** The language used for bot responses in the group. */
    language: string;

    /** A flag indicating whether welcome messages are enabled. */
    welcomeEnabled: boolean;

    /** A flag indicating whether anti link is active in the group. */
    antiLinkEnabled: boolean;

    /** A flag indicating whether NSFW content is allowed. */
    nsfwEnabled: boolean;

    /** The command prefix specific to this group, or `null` if the default is used. */
    commandPrefix: string | null;
  };

  /** Cooldowns and interaction flags for the group. */
  interaction: {
    /** The Unix timestamp of the last command used in the group. */
    lastCommandTimestamp: number;

    /** A list of command names that are disabled in this group. */
    disabledCommands: string[];
  };
}
