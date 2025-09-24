/**
 * @file ExecCommand.test.ts
 * @description A comprehensive test suite for the `ExecCommand` class.
 * This file verifies that the command correctly executes shell commands,
 * handles successful and failed command executions, and formats the output
 * for a clear and readable reply message.
 */

/**
 * @description Imports the `exec` function from Node.js's `child_process`
 * module for mocking purposes.
 */
import { exec } from 'child_process';

/**
 * @description Imports the `ExecCommand` instance to be tested.
 */
import ExecCommand from '../../../../src/libs/core/commands/ExecCommand';

/**
 * @description Imports types from the `baileys` library, used for
 * creating mock WebSocket and message objects.
 */
import type { WASocket, WAMessage } from 'baileys';

/**
 * @description Mocks the entire `child_process` module to prevent actual
 * execution of shell commands during testing. This ensures test isolation.
 */
jest.mock('child_process');

/**
 * @type {jest.Mock<any, any>}
 * @description A typed mock function for the `exec` method. This allows us
 * to control the behavior of command execution, simulating success, failure,
 * and different types of output.
 */
const mockExec = exec as unknown as jest.Mock;

/**
 * @describe Main test suite for the `ExecCommand` class.
 */
describe('ExecCommand', () => {
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
   * @beforeEach
   * @description A Jest hook that runs before each test. It clears all mocks
   * and initializes mock `sock` and `msg` objects with their required properties.
   */
  beforeEach(() => {
    jest.clearAllMocks();
    mockSock = {
      sendMessage: jest.fn().mockResolvedValue(true),
    } as unknown as WASocket;

    mockMsg = {
      key: {
        remoteJid: '123@s.whatsapp.net',
      },
    } as unknown as WAMessage;
  });

  /**
   * @test
   * @description Verifies that the command handler prompts the user for a command
   * when no arguments are provided. It ensures that the `exec` function is not
   * called in this case.
   */
  it('should prompt for a command when args are empty', async () => {
    await ExecCommand.execute(mockSock, mockMsg, []);

    expect(mockSock.sendMessage).toHaveBeenCalledWith('123@s.whatsapp.net', {
      text: 'Please provide a shell command to execute.',
    });
    expect(mockExec).not.toHaveBeenCalled();
  });

  /**
   * @test
   * @description Verifies that a successfully executed command returns the correct
   * output, including standard output (`stdout`) and standard error (`stderr`).
   */
  it('should execute a successful command and return stdout and stderr', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(null, 'file1.txt\nfile2.txt', 'warning: something minor');
    });

    await ExecCommand.execute(mockSock, mockMsg, ['ls', '-l']);

    const sentMessage = (mockSock.sendMessage as jest.Mock).mock.calls[0][1].text;

    expect(sentMessage).toContain('*Executed Successfully*');
    expect(sentMessage).toContain('ls -l');
    expect(sentMessage).toContain('*STDOUT:*');
    expect(sentMessage).toContain('file1.txt');
    expect(sentMessage).toContain('*STDERR:*');
    expect(sentMessage).toContain('warning: something minor');
  });

  /**
   * @test
   * @description Verifies that a failed command returns the error message and
   * standard error from the shell, indicating a command execution failure.
   */
  it('should handle a failed command and return the error', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(
        {
          message: 'Command not found',
          stdout: '',
          stderr: 'bash: nonexistent: command not found',
        },
        '',
        'bash: nonexistent: command not found',
      );
    });

    await ExecCommand.execute(mockSock, mockMsg, ['nonexistent']);

    const sentMessage = (mockSock.sendMessage as jest.Mock).mock.calls[0][1].text;

    expect(sentMessage).toContain('*Executed Error*');
    expect(sentMessage).toContain('nonexistent');
    expect(sentMessage).toContain('*Error:*');
    expect(sentMessage).toContain('Command not found');
    expect(sentMessage).toContain('*STDERR:*');
    expect(sentMessage).toContain('command not found');
  });

  /**
   * @test
   * @description Verifies that the standard error section is omitted from the reply
   * message when the command does not produce any output on stderr.
   */
  it('should not show stderr section if stderr is empty', async () => {
    mockExec.mockImplementation((cmd, cb) => {
      cb(null, 'Hello, world!', '');
    });

    await ExecCommand.execute(mockSock, mockMsg, ['echo', 'Hello, world!']);

    const sentMessage = (mockSock.sendMessage as jest.Mock).mock.calls[0][1].text;

    expect(sentMessage).toContain('*STDOUT:*');
    expect(sentMessage).toContain('Hello, world!');
    expect(sentMessage).not.toContain('*STDERR:*');
  });
});
