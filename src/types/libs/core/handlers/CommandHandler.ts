/**
 * @file CommandHandler.ts
 * @description Type definitions for bot commands.
 */

import { WASocket, WAMessage } from 'baileys';
import { UserRole } from '../../../../types/libs/databases/models/User';

/**
 * @interface Command
 * @description Defines the structure for a bot command. This interface ensures
 * that all command objects have a consistent and predictable shape,
 * making it easy to register, manage, and execute commands within the bot.
 */
export interface Command {
  /**
   * @property {string} name
   * @description The primary name of the command. This is used to trigger the
   * command (e.g., a user types `!help`). The name should be unique.
   */
  name: string;

  /**
   * @property {string} description
   * @description A brief explanation of what the command does. This is typically
   * used in a help command to inform users about available functionalities.
   */
  description: string;

  /**
   * @property {string[]} [aliases]
   * @description An optional array of alternative names for the command.
   * This allows the command to be triggered by multiple names (e.g., `!h` or `!halp`
   * in addition to `!help`).
   */
  aliases?: string[];

  /**
   * @property {UserRole[]} [requiredRoles]
   * @description An optional array of `UserRole` that restricts the command's execution
   * to users with one of the specified roles. This provides granular control
   * over command access for different user tiers (e.g., `['super_developer', 'moderator']`).
   */
  requiredRoles?: UserRole[];

  /**
   * @property {(sock: WASocket, msg: WAMessage, args: string[]) => Promise<void>} execute
   * @description The core function that contains the command's logic. This function
   * is executed when the command is called and receives the WebSocket connection
   * object, the message object, and any arguments provided by the user.
   * It is expected to return a promise.
   * @param {WASocket} sock The WebSocket connection object from Baileys.
   * @param {WAMessage} msg The message object that triggered the command.
   * @param {string[]} args An array of string arguments following the command name.
   */
  execute: (sock: WASocket, msg: WAMessage, args: string[]) => Promise<void>;
}
