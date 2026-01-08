/**
 * @file PingCommand.test.ts
 * @description This file tests the PingCommand class to verify latency calculation, uptime formatting, and message sending using mock data.
 */

import { WASocket, WAMessage } from 'baileys';
import os from 'os';
import PingCommand from '../../../../src/libs/core/commands/PingCommand';

// Mock the 'os' module to provide consistent test results.
jest.mock('os');

/**
 * @describe Test suite for the PingCommand.
 * @description Runs unit tests for the PingCommand class to ensure it functions as expected.
 */
describe('PingCommand', () => {
  let command: typeof PingCommand;
  let mockSock: Partial<WASocket>;
  let mockMsg: Partial<WAMessage>;

  /**
   * @beforeEach Sets up the test environment before each test case runs.
   * @description Instantiates PingCommand and creates mock socket and message objects.
   */
  beforeEach(() => {
    command = PingCommand;

    mockSock = {
      sendMessage: jest.fn(),
    };

    mockMsg = {
      key: {
        remoteJid: '12345@s.whatsapp.net',
      },
      messageTimestamp: 1728042180, // Timestamp in seconds (04 Oct 2025 21:03:00 GMT)
    };

    // Provide mock implementations for global dependencies.
    (os.loadavg as jest.Mock).mockReturnValue([0.1, 0.2, 0.3]);
    jest.spyOn(process, 'uptime').mockReturnValue(90061); // 1d 1h 1m 1s
  });

  /**
   * @afterEach Cleans up mocks after each test case to ensure test isolation.
   * @description Restores all mocked functions to their original implementations.
   */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * @it Verifies that the command has the correct static properties.
   * @description Checks if PingCommand exposes correct name, aliases, description, and requiredRoles.
   */
  it('should have the correct properties', () => {
    expect(command.name).toBe('ping');
    expect(command.aliases).toEqual(['p']);
    expect(command.description).toBe("Checks the bot's latency and response speed.");
    expect(command.requiredRoles).toEqual([]);
  });

  /**
   * @it Tests the execute method to ensure it calculates metrics correctly and sends the formatted message.
   * @description Mocks Date.now and process.uptime to simulate command execution and verifies the output message.
   */
  it('should calculate latency and send the correct formatted message', async () => {
    // Arrange: Set up mock timestamps to control the test's timing.
    const messageTimestamp = 1728042180000; // Message sent at this time
    const startTime = 1728042180123; // 123ms after the message was sent.
    const endTime = 1728042180128; // 5ms later, representing processing time.

    jest.spyOn(Date, 'now').mockReturnValueOnce(startTime).mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

    // Act: Execute the command with the mock objects.
    await command.execute(mockSock as WASocket, mockMsg as WAMessage, []);

    // Assert: Verify the results.
    const expectedLatency = 123;
    const expectedApiSpeed = 5;
    const expectedUptime = '1d 1h 1m 1s';
    const expectedLoadAvg = '0.10, 0.20, 0.30';

    const expectedReply = `┌──「 *Server Speed* 」

    Latency   : ${expectedLatency}ms
    Response  : ${expectedApiSpeed}ms

└──「 *Pong* 」`;

    expect(mockSock.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockSock.sendMessage).toHaveBeenCalledWith('12345@s.whatsapp.net', {
      text: expectedReply,
    });
  });
});
