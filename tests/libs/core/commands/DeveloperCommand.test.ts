/**
 * @file DeveloperCommand.test.ts
 * @description A comprehensive test suite for the `DeveloperCommand` class. This file
 * verifies that the command correctly retrieves the developer's profile information,
 * formats it into an image caption and a VCard, and sends both messages successfully.
 */

/**
 * @description Imports the `readFileSync` function from the Node.js `fs` module for mocking.
 */
import { readFileSync } from 'fs';

/**
 * @description Imports the `join` function from the Node.js `path` module for mocking.
 */
import { join } from 'path';

/**
 * @description Imports the single exported instance of the DeveloperCommand.
 */
import developerCommandInstance from '../../../../src/libs/core/commands/DeveloperCommand';

/**
 * @description Imports types from the `baileys` library, used for
 * creating mock WebSocket and message objects.
 */
import { WASocket, WAMessage } from 'baileys';

/**
 * @description Imports the `DeveloperInfo` interface, used for type casting and
 * accessing the private data structure of the command.
 */
import { DeveloperInfo } from '../../../../src/types/libs/core/commands/DeveloperCommand';

/**
 * @description Mocks the entire `fs` module to prevent actual file system access.
 * This ensures the test controls the image data returned.
 */
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

/**
 * @description Mocks the `path` module to control how file paths are constructed,
 * ensuring consistency across different operating systems during testing.
 */
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

/**
 * @description Mocks the `baileys` library, providing necessary types without actual implementation.
 */
jest.mock('baileys', () => ({}));

/**
 * @describe Main test suite for the `DeveloperCommand` class.
 */
describe('DeveloperCommand', () => {
  /**
   * @type {WASocket}
   * @description A mock object that simulates the `baileys` WebSocket connection.
   */
  let mockSock: WASocket;

  /**
   * @type {WAMessage}
   * @description A mock object that simulates an incoming `baileys` message.
   */
  let mockMsg: WAMessage;

  /**
   * @description A constant for the recipient JID.
   */
  const mockRemoteJid = '12345@s.whatsapp.net';

  /**
   * @description A constant for the mocked file path returned by `path.join`.
   */
  const mockImagePath = 'path/to/assets/avatar.png';

  /**
   * @description A Buffer containing mock image data returned by `fs.readFileSync`.
   */
  const mockImageBuffer = Buffer.from('mock image data');

  /**
   * @description A helper function to safely access the private `developerInfo`
   * property of the command instance for assertion verification.
   */
  const getDeveloperInfo = (commandInstance: any): DeveloperInfo => {
    return (commandInstance as any).developerInfo;
  };

  /**
   * @beforeEach
   * @description A Jest hook that runs before each test. It initializes mock
   * objects, clears all mocks, sets up the expected return values for file
   * operations, and spies on `console.error`.
   */
  beforeEach(() => {
    mockSock = {
      sendMessage: jest.fn() as any,
    } as WASocket;

    mockMsg = {
      key: {
        remoteJid: mockRemoteJid,
      },
    } as WAMessage;

    jest.clearAllMocks();
    (readFileSync as jest.Mock).mockReturnValue(mockImageBuffer);
    (join as jest.Mock).mockReturnValue(mockImagePath);
    (console.error as jest.Mock) = jest.fn();
  });

  /**
   * @test
   * @description Verifies that the command instance is correctly defined and
   * initialized with the expected name and aliases metadata.
   */
  it('should be defined and have correct metadata', () => {
    const command = developerCommandInstance;
    expect(command).toBeDefined();
    expect(command.name).toBe('developer');
    expect(command.aliases).toEqual(['dev', 'owner']);
  });

  /**
   * @test
   * @description Verifies the end to end execution flow:
   * 1. It checks that `path.join` and `readFileSync` were called correctly.
   * 2. It asserts that `sendMessage` was called exactly two times.
   * 3. It checks that the image caption and the VCard contain the correct structured information.
   */
  it('should send both the image profile and the contact card successfully', async () => {
    const command = developerCommandInstance;
    const info = getDeveloperInfo(command);
    await command.execute(mockSock, mockMsg);

    expect(join).toHaveBeenCalled();
    expect(readFileSync).toHaveBeenCalledWith(mockImagePath);
    expect(mockSock.sendMessage).toHaveBeenCalledTimes(2);

    const expectedTextProfile = [
      '┌──「 *Developer Profile* 」',
      '',
      '──「 *About Me* 」──',
      `├─ Name: ${info.name}`,
      `├─ Role: ${info.role}`,
      `└─ Bio: “${info.bio}”`,
      '',
      '──「 *Skills & Expertise* 」──',
      `└─ Languages: ${info.skills.join(', ')}`,
      '',
      '──「 *Get In Touch* 」──',
      `├─ GitHub: ${info.contacts.github}`,
      `├─ Instagram: ${info.contacts.instagram}`,
      `├─ WhatsApp: https://wa.me/${info.contacts.whatsappNumber}`,
      `└─ Email: mailto:${info.contacts.email}`,
      '',
      '└──「 *Thanks for connecting!* 」',
    ].join('\n');

    expect((mockSock.sendMessage as jest.Mock).mock.calls[0][1].caption).toBe(expectedTextProfile);

    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${info.name}\n` +
      `ORG:${info.role};\n` +
      `TEL;type=CELL;type=VOICE;waid=${info.contacts.whatsappNumber}:${info.contacts.whatsappNumber}\n` +
      `EMAIL:${info.contacts.email}\n` +
      `URL;type=GitHub:${info.contacts.github}\n` +
      `NOTE:${info.bio}\n` +
      'END:VCARD';

    expect(mockSock.sendMessage).toHaveBeenCalledWith(mockRemoteJid, {
      contacts: {
        displayName: info.name,
        contacts: [{ vcard }],
      },
    });
  });

  /**
   * @test
   * @description Verifies that if an error occurs during execution (e.g., file not found),
   * the command logs the error and sends a generic, user friendly error message.
   * It ensures the application does not crash due to file system failures.
   */
  it('should handle errors during execution and send an error message', async () => {
    const command = developerCommandInstance;

    const mockError = new Error('File not found simulation');
    (readFileSync as jest.Mock).mockImplementation(() => {
      throw mockError;
    });

    await command.execute(mockSock, mockMsg);

    expect(console.error).toHaveBeenCalledWith('Error in DeveloperCommand:', mockError);

    // Assert that only one error message was sent
    expect(mockSock.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockSock.sendMessage).toHaveBeenCalledWith(mockRemoteJid, {
      text: 'An unexpected error occurred while fetching developer information.',
    });
  });
});
