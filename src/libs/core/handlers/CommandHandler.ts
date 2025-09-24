/**
 * @file CommandHandler.ts
 * @description The CommandHandler class is responsible for loading, parsing, and
 * executing commands from incoming messages. It centralizes all command related
 * logic, including directory scanning, dynamic imports, message parsing,
 * and user permission checks, providing a robust and scalable command system.
 */

/**
 * @description Imports types and functions from the `baileys` library, which are
 * essential for interacting with the WhatsApp WebSocket connection and message objects.
 */
import { WASocket, WAMessage } from 'baileys';

/**
 * @description Imports the `readdirSync` function from Node.js's built in `fs`
 * (File System) module. This is used to synchronously read the commands directory.
 */
import { readdirSync } from 'fs';

/**
 * @description Imports the `path` module, which provides utilities for working
 * with file and directory paths. This is used to construct platform agnostic file paths.
 */
import path from 'path';

/**
 * @description Imports the `UserRole` enum, which is used to define the user
 * roles for permission checks.
 */
import { UserRole } from '../../../types/libs/databases/models/User';

/**
 * @description Imports the `MongoService` class, a static service for
 * interacting with the MongoDB database. This is used to fetch user roles.
 */
import { MongoService } from '../../../libs/databases/MongoService';

/**
 * @description Imports the `IUser` interface, used for type checking
 * the user documents fetched from the database.
 */
import { IUser } from '../../../types/libs/databases/models/User';

/**
 * @description Imports the `createUser` factory function, used to create
 * new user documents with default values.
 */
import { createUser } from '../../../libs/databases/models/User';

/**
 * @class CommandHandler
 * @description Manages all aspects of command handling. This includes loading
 * command files, parsing messages, and executing commands based on user permissions.
 */
export class CommandHandler {
  /**
   * @public
   * @readonly
   * @property {Map<string, any>} commands
   * @description A Map that stores all loaded command objects, with the command's
   * name and aliases as the keys for fast lookup.
   */
  public readonly commands: Map<string, any> = new Map();

  /**
   * @private
   * @readonly
   * @property {string} prefix
   * @description The character or string used to identify messages as commands.
   * Only messages starting with this prefix will be processed as commands.
   */
  private readonly prefix = '.';

  /**
   * @description Loads all command files from the designated commands directory.
   * This method reads the directory, dynamically imports each command file,
   * and populates the `commands` Map. It also filters out `.d.ts` files to avoid
   * importing type definitions.
   * @public
   * @throws {Error} Throws a critical error if the commands directory cannot be read,
   * which would prevent the application from functioning correctly.
   */
  public loadCommands(): void {
    const commandsPath = path.join(__dirname, '..', 'commands');
    try {
      const commandFiles = readdirSync(commandsPath).filter(
        (file) => (file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts'),
      );
      if (commandFiles.length === 0) return;
      for (const file of commandFiles) {
        this.loadCommandFile(commandsPath, file);
      }
    } catch (error: any) {
      throw new Error(`Critical error: Could not load commands. ${error.message}`);
    }
  }

  /**
   * @private
   * @description Dynamically loads a single command file. This method imports the
   * module, validates that it contains a valid command structure, and adds it
   * to the `commands` Map. It also registers any aliases the command may have.
   * This function silently ignores any errors that occur during the loading process.
   * @param {string} directory The absolute path to the commands directory.
   * @param {string} file The name of the command file to load.
   */
  private loadCommandFile(directory: string, file: string): void {
    const filePath = path.join(directory, file);
    try {
      const commandModule = require(filePath);
      const command = commandModule.default || commandModule;
      if (command?.name && typeof command.execute === 'function') {
        this.commands.set(command.name.toLowerCase(), command);
        if (command.aliases && Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            this.commands.set(alias.toLowerCase(), command);
          }
        }
      }
    } catch {}
  }

  /**
   * @description The main entry point for processing incoming messages. This method
   * checks if a message is a command, parses it, checks user permissions, and
   * executes the corresponding command logic. It also ensures that the user is
   * registered in the database before processing.
   * @public
   * @async
   * @param {WASocket} sock The WebSocket connection object from Baileys.
   * @param {WAMessage} msg The incoming message object.
   */
  public async handleMessage(sock: WASocket, msg: WAMessage): Promise<void> {
    const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    if (!messageText.startsWith(this.prefix)) return;

    const args = messageText.slice(this.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = this.commands.get(commandName);
    const isGroup = msg.key.remoteJid?.endsWith('@g.us');
    const senderJid = isGroup
      ? msg.key.participantAlt || msg.key.participant || msg.participant
      : msg.key.remoteJid;

    if (!command || !senderJid) {
      // console.warn('[CommandHandler] Invalid senderJid or command.');
      return;
    }

    await this.registerUserIfNotExists(senderJid);

    try {
      const authorized = await this.isUserAuthorized(command, senderJid);
      if (!authorized) {
        await this.sendMessage(
          sock,
          msg.key.remoteJid!,
          'You do not have permission to use this command.',
        );
        return;
      }
      await command.execute(sock, msg, args);
    } catch (error) {
      console.error('[CommandHandler] Error while executing command:', error);
      await this.sendMessage(
        sock,
        msg.key.remoteJid!,
        'An internal error occurred while processing the command.',
      );
    }
  }

  /**
   * @private
   * @async
   * @description Checks if a user already exists in the database. If not, it creates
   * a new user document with default values and inserts it into the database. This
   * ensures that every user who interacts with the bot has a corresponding database entry.
   * This function silently ignores any errors that occur during the registration process.
   * @param {string} jid The WhatsApp JID of the user.
   */
  private async registerUserIfNotExists(jid: string): Promise<void> {
    try {
      const existingUser = await MongoService.find<IUser>('users', { id: jid });
      if (existingUser.length > 0) return;

      const newUser = createUser(jid);
      await MongoService.insertOne<IUser>('users', newUser);
      console.info(`[CommandHandler] Registered new user: ${jid}`);
    } catch (error) {
      console.error(`[CommandHandler] Failed to register user ${jid}:`, error);
    }
  }

  /**
   * @private
   * @async
   * @description Checks if a user has the necessary permissions to execute a command.
   * This method handles the logic for `developer` role overrides and checks against
   * the command's `requiredRoles` property.
   * @param {any} command The command object being executed.
   * @param {string} jid The WhatsApp JID of the user.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the user is authorized, otherwise `false`.
   */
  private async isUserAuthorized(command: any, jid: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(jid);
    if (userRoles.includes(UserRole.DEVELOPER)) return true;
    if (!command.requiredRoles || command.requiredRoles.length === 0) return true;
    return command.requiredRoles.some((role: UserRole) => userRoles.includes(role));
  }

  /**
   * @private
   * @async
   * @description Fetches the roles of a user from the database. This method is
   * critical for permission checks and ensures that roles are up to date.
   * This function silently ignores any errors that occur during the fetch process.
   * @param {string} jid The WhatsApp JID of the user.
   * @returns {Promise<UserRole[]>} A promise that resolves to an array of `UserRole`.
   * It returns an empty array if the user is not found or if an error occurs.
   */
  private async getUserRoles(jid: string): Promise<UserRole[]> {
    try {
      const userDocs = await MongoService.find<IUser>('users', { id: jid });
      if (userDocs && userDocs.length > 0 && userDocs[0].roles) return userDocs[0].roles;
      return [];
    } catch {
      return [];
    }
  }

  /**
   * @private
   * @async
   * @description A utility method for sending a simple text message.
   * It handles sending the message and silently ignores any potential errors.
   * @param {WASocket} sock The WebSocket connection object.
   * @param {string} jid The recipient's WhatsApp JID.
   * @param {string} text The text content of the message to be sent.
   */
  private async sendMessage(sock: WASocket, jid: string, text: string): Promise<void> {
    try {
      await sock.sendMessage(jid, { text });
    } catch {}
  }
}
