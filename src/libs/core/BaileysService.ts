/**
 * @file BaileysService.ts
 * @description A service class that encapsulates all logic related to managing a
 * WhatsApp bot using the `baileys` library. This service handles the entire lifecycle
 * of the bot, from authentication and connection management to processing messages
 * and executing commands.
 */

/**
 * @description Imports core functions and types from the `baileys` library,
 * which are essential for creating and managing a WhatsApp bot.
 * @summary Imported functions and types:
 * - `makeWASocket`: The main factory function to create a new WhatsApp socket.
 * - `DisconnectReason`: An enum of reasons for a connection closure.
 * - `useMultiFileAuthState`: A function to manage authentication state from local files.
 * - `fetchLatestBaileysVersion`: A function to get the latest version of the library.
 * - `Browsers`: Predefined browser agents.
 * - `WASocket`, `ConnectionState`, `MessageUpsertType`, `WAMessage`: Core types.
 */
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  type WASocket,
  type ConnectionState,
  type MessageUpsertType,
  type WAMessage,
} from 'baileys';

/**
 * @description Imports error handling utilities from the `@hapi/boom` library.
 * This is used to create and throw standardized, professional errors.
 */
import { Boom, badImplementation, internal, badGateway } from '@hapi/boom';

/**
 * @description Imports `inquirer`, a library for creating interactive command
 * line prompts. It is used to get user input for the login flow.
 */
import inquirer from 'inquirer';

/**
 * @description Imports `qrcode-terminal`, a utility for generating and displaying
 * QR codes directly in the terminal.
 */
import qrcode from 'qrcode-terminal';

/**
 * @description Imports the `rm` function from Node.js's `fs/promises` module.
 * It is used for asynchronously removing the authentication data directory.
 */
import { rm } from 'fs/promises';

/**
 * @description Imports the `path` module for working with file and directory paths.
 */
import path from 'path';

/**
 * @description Imports the `pino` logger. This logger is used to create a silent
 * logger for the `baileys` socket to avoid excessive logging in the console.
 */
import pino from 'pino';

/**
 * @description Imports the local `CommandHandler` class, which is responsible for
 * processing messages and executing commands.
 */
import { CommandHandler } from './handlers/CommandHandler';

/**
 * @description Imports local type definitions for authentication related processes.
 * @summary Imported types:
 * - `AuthState`: The structure for the authentication state object.
 * - `LoginChoice`: The user's choice for the login method.
 * - `PhoneNumberInput`: The user's phone number input.
 */
import type {
  AuthState,
  LoginChoice,
  PhoneNumberInput,
} from '../../types/libs/core/BaileysService';

/**
 * @private
 * @description The path to the directory where authentication credentials will be stored.
 */
const AUTH_INFO_DIR = path.join(process.cwd(), 'sessions');

/**
 * @private
 * @description A constant string used as a prefix for all service related logs.
 */
const SERVICE_NAME = '[BaileysService]';

/**
 * @class BaileysService
 * @description A service class that manages the entire lifecycle of a WhatsApp bot.
 * It handles authentication, connection management, message processing, and command execution.
 */
class BaileysService {
  /**
   * @private
   * @property {WASocket | undefined} sock
   * @description The main Baileys WebSocket connection object. It is `undefined`
   * before the socket is created.
   */
  private sock?: WASocket;

  /**
   * @private
   * @property {AuthState | undefined} authState
   * @description The object that holds the authentication credentials and a function
   * to save them. It is `undefined` before the authentication state is loaded.
   */
  private authState?: AuthState;

  /**
   * @private
   * @property {string | null} qrCodeBuffer
   * @description A temporary buffer to store the QR code string.
   */
  private qrCodeBuffer: string | null = null;

  /**
   * @private
   * @property {boolean} shouldShowQRCode
   * @description A flag that controls whether the QR code should be displayed.
   */
  private shouldShowQRCode: boolean = false;

  /**
   * @private
   * @property {CommandHandler} commandHandler
   * @description An instance of the `CommandHandler` to handle incoming messages.
   */
  private commandHandler: CommandHandler;

  /**
   * @description Creates an instance of the BaileysService.
   * Initializes the `commandHandler` instance.
   */
  constructor() {
    this.commandHandler = new CommandHandler();
  }

  /**
   * @description The main entry point for initializing the Baileys service.
   * It orchestrates the entire setup process, including command loading,
   * authentication setup, socket creation, and event listener registration.
   * @public
   * @async
   * @returns {Promise<void>} A promise that resolves when the service is fully initialized.
   * @throws {Boom<any>} Throws a Boom error if any part of the initialization fails.
   */
  public async initialize(): Promise<void> {
    try {
      console.info(`${SERVICE_NAME} Starting Baileys Service initialization...`);
      this.commandHandler.loadCommands();
      await this.setupAuth();
      await this.createSocket();
      this.registerEventListeners();
      await this.handleLogin();
      console.info(`${SERVICE_NAME} Baileys Service initialization complete.`);
    } catch (error: unknown) {
      if (error instanceof Boom) {
        throw error;
      }
      throw badImplementation('Failed to initialize Baileys service.', { originalError: error });
    }
  }

  /**
   * @description Sends a text message to a specific recipient.
   * @public
   * @async
   * @param {string} jid The recipient's WhatsApp JID.
   * @param {string} text The text content of the message.
   * @returns {Promise<void>} A promise that resolves when the message is sent successfully.
   * @throws {Boom<any>} Throws a Boom error if the socket is not connected or if the message fails to send.
   */
  public async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.sock) {
      const error = badImplementation('Cannot send message: Baileys socket is not connected.');
      console.error(`${SERVICE_NAME} ${error.message}`);
      throw error;
    }
    try {
      await this.sock.sendMessage(jid, { text });
      console.info(`${SERVICE_NAME} Message sent successfully to ${jid}.`);
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to send message to ${jid}:`, error);
      throw badGateway(`Failed to send message to ${jid}.`, { originalError: error });
    }
  }

  /**
   * @private
   * @async
   * @description Sets up the authentication state by loading credentials from the
   * local `sessions` directory.
   * @returns {Promise<void>} A promise that resolves when the authentication state is loaded.
   * @throws {Boom<any>} Throws a Boom error if the authentication state fails to load.
   */
  private async setupAuth(): Promise<void> {
    try {
      this.authState = (await useMultiFileAuthState(AUTH_INFO_DIR)) as AuthState;
      console.info(`${SERVICE_NAME} Authentication state setup complete from: ${AUTH_INFO_DIR}`);
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to set up authentication state:`, error);
      throw badImplementation('Authentication setup failed.', { originalError: error });
    }
  }

  /**
   * @private
   * @async
   * @description Creates and configures the `WASocket` instance. It fetches
   * the latest Baileys version and sets up the socket with the loaded authentication
   * state and other options.
   * @returns {Promise<void>} A promise that resolves when the socket is created.
   * @throws {Boom<any>} Throws a Boom error if the socket creation fails.
   */
  private async createSocket(): Promise<void> {
    if (!this.authState) {
      throw badImplementation('Authentication state is not initialized. Cannot create socket.');
    }
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.info(`${SERVICE_NAME} Using Baileys version: ${version} (Latest: ${isLatest})`);

      this.sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: this.authState.state,
        browser: Browsers.macOS('Chrome'),
        generateHighQualityLinkPreview: true,
      });

      console.info(`${SERVICE_NAME} Baileys socket created successfully.`);
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to create Baileys socket:`, error);
      throw badGateway('Failed to establish connection with Baileys.', { originalError: error });
    }
  }

  /**
   * @private
   * @description Registers event listeners for the Baileys socket. This method
   * sets up handlers for credential updates, connection state changes, and new messages.
   * @returns {void}
   * @throws {Boom<any>} Throws a Boom error if the socket has not been initialized.
   */
  private registerEventListeners(): void {
    if (!this.sock) {
      throw badImplementation('Socket not initialized. Cannot register listeners.');
    }
    this.sock.ev.on('creds.update', this.onCredentialsUpdate.bind(this));
    this.sock.ev.on('connection.update', this.onConnectionUpdate.bind(this));
    this.sock.ev.on('messages.upsert', this.onMessagesUpsert.bind(this));
    console.info(`${SERVICE_NAME} Baileys event listeners registered.`);
  }

  /**
   * @private
   * @async
   * @description An event handler for `creds.update`. This method is triggered
   * when the authentication credentials change and persists them to disk.
   * @returns {Promise<void>} A promise that resolves when the credentials have been saved.
   * @throws {Boom<any>} Throws a Boom error if the credentials fail to save.
   */
  private async onCredentialsUpdate(): Promise<void> {
    if (!this.authState) return;
    try {
      await this.authState.saveCreds();
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to save credentials:`, error);
      throw internal('Failed to save authentication credentials.', { originalError: error });
    }
  }

  /**
   * @private
   * @async
   * @description An event handler for `connection.update`. This method handles
   * changes in the connection state, such as displaying QR codes, logging a successful
   * connection, or handling disconnections.
   * @param {Partial<ConnectionState>} update The partial connection state object.
   * @returns {Promise<void>}
   */
  private async onConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCodeBuffer = qr;
      if (this.shouldShowQRCode) this.displayQRCode(qr);
    }

    if (connection === 'open') {
      const user = this.sock?.user;
      console.info(`${SERVICE_NAME} Connection opened. Logged in as ${user?.name} (${user?.id})`);
      this.shouldShowQRCode = false;
      this.qrCodeBuffer = null;
    } else if (connection === 'close') {
      const error = lastDisconnect?.error as Boom | undefined;
      const statusCode = error?.output?.statusCode ?? 'Unknown';
      console.warn(`${SERVICE_NAME} Connection closed. Status code: ${statusCode}`);
      await this.handleDisconnection(error);
    }
  }

  /**
   * @private
   * @description An event handler for `messages.upsert`. This method is triggered
   * whenever new messages are received. It iterates over the messages and forwards
   * them to the `commandHandler` for processing.
   * @param {object} upsert An object containing the messages and their upsert type.
   */
  private onMessagesUpsert(upsert: { messages: WAMessage[]; type: MessageUpsertType }): void {
    if (!this.sock) return;

    for (const msg of upsert.messages) {
      if (msg.message && !msg.key.fromMe) {
        this.commandHandler.handleMessage(this.sock, msg).catch((error: unknown) => {
          console.error(`${SERVICE_NAME} Error in CommandHandler:`, error);
        });
      }
    }
  }

  /**
   * @private
   * @async
   * @description Handles the initial login flow. If the bot is not already logged
   * in, it prompts the user to choose between a pairing code and a QR code
   * login method.
   * @returns {Promise<void>} A promise that resolves when the login method is chosen.
   * @throws {Boom<any>} Throws a Boom error if the socket is not initialized or if the prompt fails.
   */
  private async handleLogin(): Promise<void> {
    if (!this.sock) {
      throw badImplementation('Socket not initialized. Cannot handle login.');
    }
    if (this.sock.user?.id) {
      return;
    }

    try {
      const { choice } = await inquirer.prompt<LoginChoice>([
        {
          type: 'list',
          name: 'choice',
          message: 'How would you like to connect?',
          choices: ['Pairing Code (Recommended)', 'QR Code'],
        },
      ]);

      if (choice === 'Pairing Code (Recommended)') {
        await this.initiatePairingCodeFlow();
      } else {
        this.shouldShowQRCode = true;
        if (this.qrCodeBuffer) this.displayQRCode(this.qrCodeBuffer);
        else console.info(`${SERVICE_NAME} Waiting for QR Code to be generated...`);
      }
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to handle login prompt:`, error);
      throw badImplementation('Login prompt interaction failed.', { originalError: error });
    }
  }

  /**
   * @private
   * @async
   * @description Handles the disconnection event. It checks the reason for
   * the disconnection and determines whether to attempt a reconnect or to
   * clear the session data for a fatal error.
   * @param {Boom | undefined} error The disconnection error, if any.
   * @returns {Promise<void>}
   */
  private async handleDisconnection(error?: Boom): Promise<void> {
    if (!error) {
      console.info(`${SERVICE_NAME} Connection closed peacefully. Reconnecting...`);
      this.initialize();
      return;
    }

    const statusCode = error.output.statusCode;
    console.error(`${SERVICE_NAME} Connection closed due to error: ${error.message}`, error);

    const isFatalError = [
      DisconnectReason.loggedOut,
      DisconnectReason.connectionReplaced,
      DisconnectReason.badSession,
      DisconnectReason.multideviceMismatch,
    ].includes(statusCode);

    if (isFatalError) {
      console.warn(
        `${SERVICE_NAME} Unrecoverable error (${DisconnectReason[statusCode]}). Clearing session data...`,
      );
      await this.clearAuthData();
      console.warn(`${SERVICE_NAME} Session data cleared. Please restart the application.`);
      process.exit(1);
    } else {
      console.info(`${SERVICE_NAME} Attempting to reconnect...`);
      this.initialize();
    }
  }

  /**
   * @private
   * @async
   * @description Initiates the pairing code login flow. It prompts the user for
   * their phone number and then requests a pairing code from WhatsApp.
   * @returns {Promise<void>} A promise that resolves after the pairing code is displayed.
   * @throws {Boom<any>} Throws a Boom error if the socket is not initialized or if the flow fails.
   */
  private async initiatePairingCodeFlow(): Promise<void> {
    if (!this.sock) {
      throw badImplementation('Socket not initialized for pairing code flow.');
    }

    try {
      const { phoneNumber } = await inquirer.prompt<PhoneNumberInput>([
        {
          type: 'input',
          name: 'phoneNumber',
          message: 'Enter your WhatsApp number (e.g., 6281234567890):',
          validate: (value: string) =>
            /^[0-9]+$/.test(value) || 'Please enter a valid phone number.',
        },
      ]);
      const code = await this.sock.requestPairingCode(phoneNumber);
      const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
      console.info(`${SERVICE_NAME} Your pairing code: ${formattedCode}`);
    } catch (error: unknown) {
      console.error(
        `${SERVICE_NAME} Failed to request pairing code. Attempting to clear auth data.`,
        error,
      );
      await this.clearAuthData();
      console.warn(`${SERVICE_NAME} Auth data cleared. Please restart.`);
      process.exit(1);
    }
  }

  /**
   * @private
   * @description Displays the provided QR code in the terminal.
   * @param {string} qr The QR code data as a string.
   */
  private displayQRCode(qr: string): void {
    console.info(`${SERVICE_NAME} Scan the QR Code below to connect:`);
    qrcode.generate(qr, { small: true });
    this.qrCodeBuffer = null;
  }

  /**
   * @private
   * @async
   * @description A utility method to delete the authentication credentials directory.
   * This is typically used for fatal errors that require a fresh login.
   * @returns {Promise<void>} A promise that resolves when the directory is deleted.
   * @throws {Boom<any>} Throws a Boom error if the directory fails to delete.
   */
  private async clearAuthData(): Promise<void> {
    try {
      await rm(AUTH_INFO_DIR, { recursive: true, force: true });
      console.info(`${SERVICE_NAME} Authentication data cleared successfully.`);
    } catch (error: unknown) {
      console.error(`${SERVICE_NAME} Failed to clear authentication data:`, error);
      throw internal('Failed to clear auth data directory.', { originalError: error });
    }
  }
}

export default BaileysService;
