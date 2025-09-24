/**
 * @file EvalCommand.test.ts
 * @description A comprehensive test suite for the `EvalCommand` class.
 * This file verifies the behavior of the evaluation command, including
 * successful code execution, error handling for syntax and runtime errors,
 * and graceful failure when collecting system information.
 */

/**
 * @description Imports the `v8` module for mocking heap statistics.
 */
import v8 from 'v8';

/**
 * @description Imports the `EvalCommand` instance to be tested.
 */
import EvalCommand from '../../../../src/libs/core/commands/EvalCommand';

/**
 * @description Imports types from the `baileys` library, used for
 * creating mock WebSocket and message objects.
 */
import { WAMessage, WASocket } from 'baileys';

/**
 * @description Mocks the `v8` module to control its output and simulate
 * various scenarios without affecting the real system environment.
 */
jest.mock('v8');

/**
 * @describe Main test suite for the `EvalCommand` class.
 */
describe('EvalCommand', () => {
  /**
   * @type {WASocket}
   * @description A mock object that simulates the `baileys` WebSocket connection.
   */
  let sock: WASocket;

  /**
   * @type {WAMessage}
   * @description A mock object that simulates an incoming `baileys` message.
   */
  let msg: WAMessage;

  /**
   * @beforeEach
   * @description A Jest hook that runs before each test. It initializes mock
   * `sock` and `msg` objects and resets the `v8.getHeapStatistics` mock.
   */
  beforeEach(() => {
    sock = {
      sendMessage: jest.fn(),
    } as unknown as WASocket;

    msg = {
      key: {
        remoteJid: '12345@s.whatsapp.net',
      },
    } as unknown as WAMessage;

    (v8.getHeapStatistics as jest.Mock).mockReset();
  });

  /**
   * @test
   * @description Verifies that the command handles errors that occur while trying
   * to get heap statistics. It should report the failure gracefully without crashing
   * the command execution.
   */
  it('should handle errors in heap statistics gracefully', async () => {
    (v8.getHeapStatistics as jest.Mock).mockImplementation(() => {
      throw new Error('heap fail');
    });

    await EvalCommand.execute(sock, msg, ['2 + 2']);

    const sendMessageMock = sock.sendMessage as jest.Mock;
    const sentText = sendMessageMock.mock.calls[0][1].text;

    expect(sentText).toContain('Failed to get Heap Statistics');
    expect(sentText).toContain('heap fail');
  });

  /**
   * @test
   * @description Verifies that the command correctly evaluates valid JavaScript code
   * and replies with a message containing the correct output and heap statistics.
   */
  it('should evaluate and reply with correct output', async () => {
    (v8.getHeapStatistics as jest.Mock).mockImplementation(() => ({
      used_heap_size: 64000000,
      total_heap_size: 123000000,
      heap_size_limit: 1994000000,
    }));

    await EvalCommand.execute(sock, msg, ['2 + 2']);

    const sendMessageMock = sock.sendMessage as jest.Mock;
    const sentText = sendMessageMock.mock.calls[0][1].text;

    expect(sentText).toContain('Evaluated Successfully');
    expect(sentText).toContain('4');
    expect(sentText).toContain('Heap Statistics');
  });

  /**
   * @test
   * @description Verifies that the command correctly detects and reports syntax errors
   * in the provided code without attempting to execute it.
   */
  it('should handle syntax errors', async () => {
    await EvalCommand.execute(sock, msg, ['if (']);

    const sendMessageMock = sock.sendMessage as jest.Mock;
    const sentText = sendMessageMock.mock.calls[0][1].text;

    expect(sentText).toContain('Syntax Error Detected');
  });

  /**
   * @test
   * @description Verifies that the command prompts the user for code if no arguments
   * are provided. It should not attempt to execute any code.
   */
  it('should prompt for code when args empty', async () => {
    await EvalCommand.execute(sock, msg, []);

    const sendMessageMock = sock.sendMessage as jest.Mock;
    expect(sendMessageMock).toHaveBeenCalledWith('12345@s.whatsapp.net', {
      text: 'Please provide JavaScript code to evaluate.',
    });
  });
});
