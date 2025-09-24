/**
 * @file CommandHandler.test.ts
 * @description A comprehensive test suite for the `CommandHandler` class. This file
 * verifies that the command handler correctly loads commands, parses incoming
 * messages, checks user permissions, and executes commands as expected. It uses
 * Jest's mocking capabilities to isolate the command handler from its dependencies.
 */

/**
 * @description Imports the `CommandHandler` class to be tested.
 */
import { CommandHandler } from '../../../../src/libs/core/handlers/CommandHandler';

/**
 * @description Imports the `MongoService` class for mocking database interactions.
 */
import { MongoService } from '../../../../src/libs/databases/MongoService';

/**
 * @description Imports the `UserRole` enum, used for mocking and testing
 * permission based command restrictions.
 */
import { UserRole } from '../../../../src/types/libs/databases/models/User';

/**
 * @description Imports the `EvalCommand` instance for mocking and testing.
 */
import EvalCommandInstance from '../../../../src/libs/core/commands/EvalCommand';

/**
 * @description Imports the `fs` module for mocking directory read operations.
 * This allows the test to simulate the file system without actual file access.
 */
import * as fs from 'fs';

/**
 * @description Mocks the entire `fs` module to prevent actual file system access.
 * This is crucial for creating isolated and predictable tests for command loading.
 */
jest.mock('fs');

/**
 * @description Mocks the entire `MongoService` class to simulate database
 * interactions without connecting to a real database.
 */
jest.mock('../../../../src/libs/databases/MongoService');

/**
 * @description Mocks the `EvalCommand` module to control its behavior during tests.
 * This mock ensures the command is loaded with a specific name, aliases,
 * required roles, and a controlled `execute` function.
 */
jest.mock('../../../../src/libs/core/commands/EvalCommand', () => ({
  __esModule: true,
  default: {
    name: 'eval',
    aliases: ['ev'],
    requiredRoles: [UserRole.DEVELOPER],
    execute: jest.fn().mockResolvedValue(true),
  },
}));

/**
 * @type {jest.Mock<any, any>}
 * @description A typed mock function for `fs.readdirSync`. This allows us to
 * control the list of files returned when the command handler attempts to load commands.
 */
const mockReaddirSync = fs.readdirSync as jest.Mock;

/**
 * @type {jest.Mock<any, any>}
 * @description A typed mock function for `MongoService.find`. This allows us to
 * control the user data returned by the database for permission checks.
 */
const mockMongoFind = MongoService.find as jest.Mock;

/**
 * @describe Main test suite for the `CommandHandler` class.
 */
describe('CommandHandler', () => {
  /**
   * @type {CommandHandler}
   * @description The instance of `CommandHandler` that will be tested.
   */
  let commandHandler: CommandHandler;

  /**
   * @type {any}
   * @description A mock object that simulates the `baileys` WebSocket connection.
   */
  let mockSock: any;

  /**
   * @beforeAll
   * @description A Jest hook that runs once before all tests. It spies on all
   * `console` methods to prevent test logs from cluttering the terminal output.
   */
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  /**
   * @afterAll
   * @description A Jest hook that runs once after all tests. It restores all
   * console spies to their original implementations.
   */
  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * @description A helper function to create a mock message object with a given text
   * and sender JID.
   * @param {string} text The message text.
   * @param {string} senderJid The JID of the message sender.
   * @returns {object} The mock message object.
   */
  const createMockMessage = (text: string, senderJid: string) => ({
    key: { remoteJid: 'group@g.us', participantAlt: senderJid, fromMe: false },
    message: { conversation: text },
  });

  /**
   * @description A mock command object that simulates a simple public command.
   */
  const mockPublicCommand = {
    name: 'menu',
    aliases: [],
    execute: jest.fn().mockResolvedValue(true),
  };

  /**
   * @description A constant for a mock developer user JID.
   */
  const devJid = 'dev@s.whatsapp.net';

  /**
   * @description A constant for a mock regular user JID.
   */
  const userJid = 'user@s.whatsapp.net';

  /**
   * @beforeEach
   * @description A Jest hook that runs before each test. It resets the module registry
   * and clears all mocks to ensure a clean slate for each test case.
   */
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    commandHandler = new CommandHandler();
    mockSock = { sendMessage: jest.fn().mockResolvedValue(true) };
  });

  /**
   * @describe A nested test suite for the command loading logic.
   */
  describe('Command Loading', () => {
    /**
     * @test
     * @description Verifies that the command handler can successfully load
     * a command from a file and add it to the commands map.
     */
    it('should load commands successfully', async () => {
      mockReaddirSync.mockReturnValue(['menu.ts']);

      jest.doMock(
        '../../../../src/libs/core/commands/menu.ts',
        () => ({
          __esModule: true,
          default: mockPublicCommand,
        }),
        { virtual: true },
      );

      commandHandler.loadCommands();

      expect(commandHandler.commands.get('menu')).toBe(mockPublicCommand);
    });

    /**
     * @test
     * @description Verifies that the command handler gracefully handles an
     * empty commands directory without crashing.
     */
    it('should handle an empty commands directory', () => {
      mockReaddirSync.mockReturnValue([]);
      commandHandler.loadCommands();
      expect(commandHandler.commands.size).toBe(0);
    });

    /**
     * @test
     * @description Verifies that the command handler skips files that do not
     * have a valid command structure (e.g., missing an `execute` function).
     */
    it('should skip files with invalid command structure', () => {
      mockReaddirSync.mockReturnValue(['invalid.ts']);

      jest.doMock(
        '../../../../src/libs/core/commands/invalid.ts',
        () => ({
          __esModule: true,
          default: { name: 'invalid' },
        }),
        { virtual: true },
      );

      commandHandler.loadCommands();
      expect(commandHandler.commands.size).toBe(0);
    });

    /**
     * @test
     * @description Verifies that the command handler handles errors when it
     * attempts to import a command file that contains a syntax error.
     */
    it('should handle errors when requiring a command file', () => {
      mockReaddirSync.mockReturnValue(['error.ts']);

      jest.doMock(
        '../../../../src/libs/core/commands/error.ts',
        () => {
          throw new Error('Syntax Error');
        },
        { virtual: true },
      );

      commandHandler.loadCommands();
      expect(commandHandler.commands.size).toBe(0);
    });

    /**
     * @test
     * @description Verifies that the command handler throws a critical error
     * if the commands directory itself cannot be read.
     */
    it('should throw an error if the directory cannot be read', () => {
      mockReaddirSync.mockImplementation(() => {
        throw new Error('Permission Denied');
      });

      expect(() => commandHandler.loadCommands()).toThrow(
        'Critical error: Could not load commands. Permission Denied',
      );
    });
  });

  /**
   * @describe A nested test suite for the message handling and command execution logic.
   */
  describe('Message Handling', () => {
    /**
     * @beforeEach
     * @description A Jest hook that runs before each test in this suite. It
     * populates the command handler's commands map with a public and a
     * restricted command.
     */
    beforeEach(() => {
      commandHandler.commands.set('menu', mockPublicCommand);
      commandHandler.commands.set('eval', EvalCommandInstance);
    });

    /**
     * @test
     * @description Verifies that the command handler correctly ignores messages
     * that contain only the command prefix without a command name.
     */
    it('should ignore messages with only a prefix', async () => {
      await commandHandler.handleMessage(mockSock, createMockMessage('.', userJid));
      expect(mockPublicCommand.execute).not.toHaveBeenCalled();
    });

    /**
     * @test
     * @description Verifies that a user can successfully execute a command
     * that has no role restrictions.
     */
    it('should execute a public command', async () => {
      mockMongoFind.mockResolvedValue([{ roles: [] }]);
      await commandHandler.handleMessage(mockSock, createMockMessage('.menu', userJid));
      expect(mockPublicCommand.execute).toHaveBeenCalled();
    });

    /**
     * @test
     * @description Verifies that a user with the `DEVELOPER` role can successfully
     * execute a restricted command.
     */
    it('should execute a restricted command for a developer', async () => {
      mockMongoFind.mockResolvedValue([{ roles: [UserRole.DEVELOPER] }]);
      const msg = createMockMessage('.eval 1+1', devJid);
      await commandHandler.handleMessage(mockSock, msg);
      expect(EvalCommandInstance.execute).toHaveBeenCalledWith(mockSock, msg, ['1+1']);
    });

    /**
     * @test
     * @description Verifies that a regular user is denied access to a restricted
     * command and receives the correct permission denied message.
     */
    it('should deny access for a regular user to a restricted command', async () => {
      mockMongoFind.mockResolvedValue([{ roles: [] }]);
      await commandHandler.handleMessage(mockSock, createMockMessage('.eval 1+1', userJid));
      expect(mockSock.sendMessage).toHaveBeenCalledWith(expect.any(String), {
        text: 'You do not have permission to use this command.',
      });
    });

    /**
     * @test
     * @description Verifies that the command handler handles execution errors
     * gracefully by sending a generic error message to the user instead of crashing.
     */
    it('should handle execution errors gracefully', async () => {
      mockMongoFind.mockResolvedValue([{ roles: [UserRole.DEVELOPER] }]);
      (EvalCommandInstance.execute as jest.Mock).mockRejectedValue(new Error('Eval failed'));
      await commandHandler.handleMessage(mockSock, createMockMessage('.eval 1+1', devJid));
      expect(mockSock.sendMessage).toHaveBeenCalledWith(expect.any(String), {
        text: 'An internal error occurred while processing the command.',
      });
    });

    /**
     * @test
     * @description Verifies that the command handler does not crash if the `sendMessage`
     * utility itself fails to send a message.
     */
    it('should not crash if sendMessage fails', async () => {
      mockMongoFind.mockResolvedValue([{ roles: [] }]);
      mockSock.sendMessage.mockRejectedValue(new Error('Connection failed'));
      await expect(
        commandHandler.handleMessage(mockSock, createMockMessage('.eval', userJid)),
      ).resolves.not.toThrow();
    });

    /**
     * @test
     * @description Verifies that if a user document is found but has no roles
     * property, the authorization logic defaults to treating them as having no roles.
     */
    it('should treat users without a roles property as having no roles', async () => {
      mockMongoFind.mockResolvedValue([{ id: userJid }]);
      await commandHandler.handleMessage(mockSock, createMockMessage('.eval', userJid));
      expect(EvalCommandInstance.execute).not.toHaveBeenCalled();
    });
  });
});
