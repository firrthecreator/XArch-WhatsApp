/**
 * @file ExecCommand.ts
 * @description A highly privileged command for executing shell commands directly on the server.
 * This provides a powerful tool for bot developers, but due to its security implications,
 * it is strictly restricted to the highest level of user roles.
 */

/**
 * @description Imports types from the `baileys` library, which are essential for
 * defining the parameters for command execution.
 */
import { WAMessage, WASocket } from 'baileys';

/**
 * @description Imports the `exec` function from Node.js's `child_process` module.
 * This is used to execute a shell command in a new process.
 */
import { exec } from 'child_process';

/**
 * @description Imports the `Command` interface, which defines the standard
 * structure for all bot commands.
 */
import { Command } from '../../../types/libs/core/handlers/CommandHandler';

/**
 * @description Imports the `UserRole` enum, which is used to define
 * the roles required for this command's execution.
 */
import { UserRole } from '../../../types/libs/databases/models/User';

/**
 * @description Imports the `CommandExecutionStatus` type, which defines the possible
 * outcomes of a command's execution.
 */
import { CommandExecutionStatus } from '../../../types/libs/core/commands/ExecCommand';

/**
 * @class ExecCommand
 * @description A command that executes shell commands. This is a very
 * DANGEROUS command and should only be available to trusted users due to its
 * ability to access the underlying operating system.
 */
class ExecCommand implements Command {
  /** The primary name of the command. */
  name = 'exec';

  /** An array of alternative names for the command. */
  aliases = ['ex'];

  /** A brief description of the command's purpose. */
  description = 'Executes shell commands on the server. DANGEROUS. Owner only.';

  /** The roles required to execute this command. */
  requiredRoles = [UserRole.DEVELOPER];

  /**
   * @description Executes the core logic of the `exec` command. It takes
   * a string of shell commands as input, executes them, and returns a formatted
   * reply with the output or any errors.
   * @async
   * @param {WASocket} sock The WebSocket connection object from Baileys.
   * @param {WAMessage} msg The message object that triggered the command.
   * @param {string[]} args An array of string arguments containing the shell command.
   * @returns {Promise<void>} A promise that resolves when the reply message has been sent.
   */
  async execute(sock: WASocket, msg: WAMessage, args: string[]): Promise<void> {
    const remoteJid = msg.key.remoteJid!;
    if (!args.length) {
      await sock.sendMessage(remoteJid, { text: 'Please provide a shell command to execute.' });
      return;
    }

    const commandToExecute = args.join(' ');
    const startTime = Date.now();

    let output: string;
    let status: CommandExecutionStatus = 'Successfully';

    try {
      const result = await this.executeShellCommand(commandToExecute);
      output = `*STDOUT:*\n\`\`\`\n${result.stdout.trim()}\n\`\`\``;
      if (result.stderr) {
        output += `\n\n*STDERR:*\n\`\`\`\n${result.stderr.trim()}\n\`\`\``;
      }
    } catch (error: any) {
      status = 'Error';
      output = `*Error:* \`\`\`\n${error.message}\n\`\`\``;
      if (error.stdout) {
        output += `\n\n*STDOUT:*\n\`\`\`\n${error.stdout.trim()}\n\`\`\``;
      }
      if (error.stderr) {
        output += `\n\n*STDERR:*\n\`\`\`\n${error.stderr.trim()}\n\`\`\``;
      }
    }

    const execTime = Date.now() - startTime;
    const replyText = `*Executed ${status}*

*Input:*
\`\`\`bash
${commandToExecute}
\`\`\`

${output}

*Execution Time: ${execTime} ms*`;

    await sock.sendMessage(remoteJid, { text: replyText });
  }

  /**
   * @private
   * @description Executes a shell command and wraps it in a promise.
   * This provides a clean way to handle the asynchronous nature of `exec`.
   * @param {string} command The shell command string to be executed.
   * @returns {Promise<{ stdout: string; stderr: string }>} A promise that resolves
   * with the standard output and standard error, or rejects with an error object.
   */
  private executeShellCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          const enrichedError = { ...error, stdout, stderr };
          reject(enrichedError);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }
}

/**
 * @description Exports a new instance of the `ExecCommand` class as the default
 * export. This instance is then used by the command handler to register and execute
 * the command.
 */
export default new ExecCommand();
