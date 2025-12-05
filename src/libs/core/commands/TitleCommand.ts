/**
 * @file TitleCommand.ts
 * @description A command that allows users to manage their profile titles.
 * Users can list all titles they own and select one to be their active title
 * which is displayed on their profile or overlay.
 */

import { WAMessage, WASocket } from 'baileys';
import { Command } from '../../../types/libs/core/handlers/CommandHandler';
import { MongoService } from '../../../libs/databases/MongoService';
import { UserRole } from '../../../types/libs/databases/models/User';
import { IUserWithTitles } from '../../../types/libs/core/commands/TitleCommand';

/**
 * @class TitleCommand
 * @description Manages user titles. It provides functionality to view the list
 * of owned titles and equip a specific title using its corresponding index number.
 */
class TitleCommand implements Command {
  /** The primary name of the command. */
  name: string = 'title';

  /** An array of alternative names for the command. */
  aliases: string[] = ['settitle', 'mytitles'];

  /** A brief description of the command. */
  description: string = 'Lists owned titles and allows equipping a title by number.';

  /** The roles required to execute this command (accessible to everyone). */
  requiredRoles: UserRole[] = [];

  /**
   * @description Executes the title management logic.
   * If no arguments are provided, it lists all owned titles.
   * If a number is provided, it attempts to equip the title at that index.
   *
   * @async
   * @param {WASocket} sock The WebSocket connection object.
   * @param {WAMessage} msg The message object triggering the command.
   * @param {string[]} args Arguments passed by the user (e.g., ["1"]).
   * @returns {Promise<void>}
   */
  async execute(sock: WASocket, msg: WAMessage, args: string[]): Promise<void> {
    const remoteJid: string = msg.key.remoteJid!;
    const isGroup: boolean = remoteJid.endsWith('@g.us');

    // Determine the sender ID based on whether it is a group or private chat
    const sender: string | undefined | null = isGroup
      ? msg.key.participantAlt || msg.key.participant || msg.participant
      : msg.key.remoteJid;

    if (!sender) return;

    try {
      // Fetch the user's data from the database with strict typing
      const users = await MongoService.find('users', { id: sender });
      const user = users[0] as unknown as IUserWithTitles | undefined;

      if (!user) {
        await sock.sendMessage(remoteJid, { text: 'User data not found in database.' });
        return;
      }

      /**
       * @description Extract title data from the user's customization settings.
       * Defaulting to empty array/null if undefined to prevent runtime errors.
       */
      const ownedTitles: string[] = user.customization?.titles?.owned || [];
      const activeTitle: string | null = user.customization?.titles?.active || null;

      // Case 1: No arguments provided - Show the list
      if (args.length === 0) {
        if (ownedTitles.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: 'You do not own any titles yet. Participate in events to earn them!',
          });
          return;
        }

        /**
         * @description Maps the owned titles to a numbered list string.
         * Adds a marker "(Active)" next to the currently equipped title.
         */
        const titleList: string = ownedTitles
          .map((title: string, index: number) => {
            const status: string = title === activeTitle ? ' *(Active)*' : '';
            return `${index + 1}. ${title}${status}`;
          })
          .join('\n');

        const replyText: string = `┌──「 *Your Titles* 」
│
${titleList}
│
└──「 *How to equip* 」
Type: *${this.name} <number>*
Example: *${this.name} 1*`;

        await sock.sendMessage(remoteJid, { text: replyText });
        return;
      }

      // Case 2: Argument provided - Equip a title
      const targetIndex: number = parseInt(args[0], 10);

      /**
       * @description Validates the input. It must be a number, greater than 0,
       * and within the range of the owned titles array.
       */
      if (isNaN(targetIndex) || targetIndex < 1 || targetIndex > ownedTitles.length) {
        await sock.sendMessage(remoteJid, {
          text: `Invalid selection. Please verify the number by typing *${this.name}* to see your list.`,
        });
        return;
      }

      // Arrays are 0-indexed, so we subtract 1 from the user's input
      const selectedTitle: string = ownedTitles[targetIndex - 1];

      // Check if the user is trying to equip the title that is already active
      if (selectedTitle === activeTitle) {
        await sock.sendMessage(remoteJid, {
          text: `The title "${selectedTitle}" is already equipped.`,
        });
        return;
      }

      // Update the user document using the generic update method
      await MongoService.updateOne(
        'users',
        { id: sender },
        {
          $set: { 'customization.titles.active': selectedTitle },
        },
      );

      await sock.sendMessage(remoteJid, {
        text: `Successfully equipped title: *${selectedTitle}*`,
      });
    } catch (error) {
      console.error('Error in TitleCommand:', error);
      await sock.sendMessage(remoteJid, {
        text: 'An unexpected error occurred while managing your titles.',
      });
    }
  }
}

/**
 * @description Exports the instance of TitleCommand.
 */
export default new TitleCommand();
