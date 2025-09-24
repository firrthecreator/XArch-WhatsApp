/**
 * @file src/commands/utility/EvalCommand.ts
 * @description A highly privileged command for evaluating arbitrary JavaScript code.
 * This command provides a powerful debugging tool for bot developers, allowing them
 * to execute code directly within the application's runtime and inspect the results.
 * Due to its nature, it is restricted to the highest level of user roles.
 */

/**
 * @description Imports the `WAMessage` and `WASocket` types from the `baileys` library,
 * which are essential for defining the parameters for command execution.
 */
import { WAMessage, WASocket } from 'baileys';

/**
 * @description Imports the `inspect` utility from Node.js's built in `util` module.
 * It is used here to format the output of the evaluated JavaScript code in a readable way.
 */
import { inspect } from 'util';

/**
 * @description Imports a function to check for syntax errors in JavaScript code.
 * This is an important safety measure to prevent execution of malformed code.
 */
import checkSyntax from 'syntax-error';

/**
 * @description Imports the `v8` module, which provides access to V8 specific
 * functions. It is used here to get heap statistics for monitoring memory usage.
 */
import v8 from 'v8';

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
 * @description Imports the `ExecutionStatus` type, which defines the possible
 * outcomes of a command's execution.
 */
import { ExecutionStatus } from '../../../types/libs/core/commands/EvalCommand';

/**
 * @description Imports the `MongoService` class, a static service for
 * interacting with the MongoDB database. This service is made available
 * within the evaluation context of the command.
 */
import { MongoService } from '../../../libs/databases/MongoService';

/**
 * @description Retrieves a copy of the V8 heap statistics object. This is a simple
 * utility function to get the current memory usage of the V8 JavaScript engine.
 * @returns {v8.HeapStatistics} An object containing the heap statistics.
 */
function getHeapStatistics() {
  return v8.getHeapStatistics();
}

/**
 * @class EvalCommand
 * @description A command that executes raw JavaScript code. This is a very
 * DANGEROUS command and should only be available to trusted users due to its
 * ability to access and manipulate the entire application's environment.
 */
class EvalCommand implements Command {
  /** The primary name of the command. */
  name = 'eval';

  /** An array of alternative names for the command. */
  aliases = ['ev'];

  /** A brief description of the command's purpose. */
  description = 'Executes raw JavaScript code. DANGEROUS. Owner only.';

  /** The roles required to execute this command. */
  requiredRoles = [UserRole.DEVELOPER];

  /**
   * @description Executes the core logic of the `eval` command. It takes
   * JavaScript code as input, performs a syntax check, and then attempts
   * to execute the code. It captures the output, execution time, and memory
   * usage, returning a detailed report. The `MongoService` is made available
   * as the variable `db` within the evaluated code context.
   * @async
   * @param {WASocket} sock The WebSocket connection object from Baileys.
   * @param {WAMessage} msg The message object that triggered the command.
   * @param {string[]} args An array of string arguments containing the JavaScript code.
   * @returns {Promise<void>} A promise that resolves when the reply message has been sent.
   */
  async execute(sock: WASocket, msg: WAMessage, args: string[]): Promise<void> {
    const remoteJid = msg.key.remoteJid!;
    if (!args.length) {
      await sock.sendMessage(remoteJid, { text: 'Please provide JavaScript code to evaluate.' });
      return;
    }

    const codeToEvaluate = args.join(' ');
    const startTime = Date.now();
    const syntaxError = checkSyntax(codeToEvaluate, 'eval.js');

    if (syntaxError) {
      const execTime = Date.now() - startTime;
      const replyText = `*Syntax Error Detected*

*Input:*
\`\`\`javascript
${codeToEvaluate}
\`\`\`

*Error:*
\`\`\`
${syntaxError.message}
\`\`\`

*Execution Time: ${execTime} ms*`;
      await sock.sendMessage(remoteJid, { text: replyText });
      return;
    }

    let resultOutput: string;
    let executionStatus: ExecutionStatus;

    try {
      /**
       * @description This is where the code is executed. The `MongoService` is
       * explicitly aliased as `db` and made available in the local scope before `eval`
       * is called, allowing the evaluated code to interact with the database.
       */
      const result = await (async () => {
        const db = MongoService; // MongoService available in eval context
        return eval(codeToEvaluate);
      })();
      resultOutput = inspect(result, { depth: 2, colors: false });
      executionStatus = 'Successfully';
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      resultOutput = err.stack || err.message;
      executionStatus = 'Error';
    }

    const execTime = Date.now() - startTime;
    let heapStatsOutput: string;

    try {
      const heapStats = getHeapStatistics();
      const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
      heapStatsOutput = `*Heap Statistics:*
- Used: ${formatBytes(heapStats.used_heap_size)} MB
- Total: ${formatBytes(heapStats.total_heap_size)} MB
- Limit: ${formatBytes(heapStats.heap_size_limit)} MB`;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      heapStatsOutput = `*Failed to get Heap Statistics:*\n\`\`\`\n${err.message}\n\`\`\``;
    }

    const replyText = `*Evaluated ${executionStatus}*

*Input:*
\`\`\`javascript
${codeToEvaluate}
\`\`\`

*Output:*
\`\`\`
${resultOutput}
\`\`\`

${heapStatsOutput}

*Execution Time: ${execTime} ms*`;

    await sock.sendMessage(remoteJid, { text: replyText });
  }
}

/**
 * @description Exports a new instance of the `EvalCommand` class as the default
 * export. This instance is then used by the command handler to register and execute
 * the command.
 */
export default new EvalCommand();
