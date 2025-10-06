/**
 * @file DeveloperCommand.ts
 * @description A command that displays the developer's profile, contact information,
 * and expertise. This serves as an informational command and a direct way for users
 * to contact the bot's maintainer.
 */

/**
 * @description Imports types from the `baileys` library, which are essential
 * for command execution and sending messages.
 */
import { WAMessage, WASocket } from 'baileys';

/**
 * @description Imports the `Command` interface, which defines the standard
 * structure for all bot commands.
 */
import { Command } from '../../../types/libs/core/handlers/CommandHandler';

/**
 * @description Imports the `UserRole` enum, used to restrict this command's
 * execution to only developers.
 */
import { UserRole } from '../../../types/libs/databases/models/User';

/**
 * @description Imports the `readFileSync` function from the `fs` module to
 * synchronously read the developer's profile image file.
 */
import { readFileSync } from 'fs';

/**
 * @description Imports the `join` function from the `path` module to
 * construct platform agnostic file paths.
 */
import { join } from 'path';

/**
 * @description Imports the `DeveloperInfo` interface, which defines the
 * structured format for the developer's personal data.
 */
import { DeveloperInfo } from '../../../types/libs/core/commands/DeveloperCommand';

/**
 * @class DeveloperCommand
 * @description Implements the developer command, providing structured information
 * and a contact card for the bot owner.
 */
class DeveloperCommand implements Command {
  /** The primary name of the command. */
  name = 'developer';

  /** An array of alternative names for the command. */
  aliases = ['dev', 'owner'];

  /** A brief description of the command's purpose. */
  description = "Displays information and the contact card of the bot's developer.";

  /** The roles required to execute this command. */
  requiredRoles = [UserRole.DEVELOPER];

  /**
   * @private
   * @property {DeveloperInfo} developerInfo
   * @description A private property holding all static, structured information
   * about the developer, including contact details and biography.
   */
  private developerInfo: DeveloperInfo = {
    name: 'Ananda Firmansyah',
    role: 'Lead Developer & Bot Owner',
    bio: 'A passionate developer who loves building innovative solutions and exploring new technologies.',
    skills: ['TypeScript', 'JavaScript', 'Node.js', 'Python', 'C++', 'Go'],
    contacts: {
      github: 'https://github.com/firrthecreator',
      instagram: 'https://instagram.com/frrmnsyaa',
      whatsappNumber: '6285189328920',
      email: 'firrthecreator@gmail.com',
    },
  };

  /**
   * @description Executes the developer command. It sends the user a formatted
   * profile card containing biographical and skill details, followed by an
   * official VCard contact message.
   * @async
   * @param {WASocket} sock The WebSocket connection object from Baileys.
   * @param {WAMessage} msg The message object that triggered the command.
   * @returns {Promise<void>} A promise that resolves when both the image message
   * and the contact message have been sent.
   */
  async execute(sock: WASocket, msg: WAMessage): Promise<void> {
    const remoteJid = msg.key.remoteJid!;
    try {
      const { name, role, bio, skills, contacts } = this.developerInfo;

      /**
       * @description Constructs the highly formatted text profile using array join
       * for clean string presentation.
       */
      const textProfile = [
        '┌──「 *Developer Profile* 」',
        '',
        '──「 *About Me* 」──',
        `├─ Name: ${name}`,
        `├─ Role: ${role}`,
        `└─ Bio: “${bio}”`,
        '',
        '──「 *Skills & Expertise* 」──',
        `└─ Languages: ${skills.join(', ')}`,
        '',
        '──「 *Get In Touch* 」──',
        `├─ GitHub: ${contacts.github}`,
        `├─ Instagram: ${contacts.instagram}`,
        `├─ WhatsApp: https://wa.me/${contacts.whatsappNumber}`,
        `└─ Email: mailto:${contacts.email}`,
        '',
        '└──「 *Thanks for connecting!* 」',
      ].join('\n');

      // Send the profile image with the formatted text as the caption
      const imagePath = join(__dirname, '../../../../assets/avatar.png');
      await sock.sendMessage(remoteJid, { image: readFileSync(imagePath), caption: textProfile });

      /**
       * @description Constructs the VCard string, which allows the user to
       * easily save the developer's contact information.
       */
      const vcard =
        'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        `FN:${name}\n` +
        `ORG:${role};\n` +
        `TEL;type=CELL;type=VOICE;waid=${contacts.whatsappNumber}:${contacts.whatsappNumber}\n` +
        `EMAIL:${contacts.email}\n` +
        `URL;type=GitHub:${contacts.github}\n` +
        `NOTE:${bio}\n` +
        'END:VCARD';

      const contactMessage = {
        contacts: {
          displayName: name,
          contacts: [{ vcard }],
        },
      };

      // Send the VCard message
      await sock.sendMessage(remoteJid, contactMessage);
    } catch (error) {
      console.error('Error in DeveloperCommand:', error);
      await sock.sendMessage(remoteJid, {
        text: 'An unexpected error occurred while fetching developer information.',
      });
    }
  }
}

/**
 * @description Exports a new instance of the `DeveloperCommand` class as the default
 * export. This instance is then used by the command handler to register and execute
 * the command.
 */
export default new DeveloperCommand();
