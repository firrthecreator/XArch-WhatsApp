/**
 * @file PingCommand.ts
 * @description A command to check the bot's responsiveness.
 * It calculates the latency between the message timestamp and the server processing time.
 */

import { WAMessage, WASocket } from 'baileys';
import { Command } from '../../../types/libs/core/handlers/CommandHandler';
import { UserRole } from '../../../types/libs/databases/models/User';

/**
 * @class PingCommand
 * @description Measures the latency and response speed of the bot without extra system overhead.
 */
class PingCommand implements Command {
  /** The primary name of the command. */
  name: string = 'ping';

  /** An array of alternative names for the command. */
  aliases: string[] = ['p'];

  /** A brief description of the command. */
  description: string = "Checks the bot's latency and response speed.";

  /** The roles required to execute this command (accessible to everyone). */
  requiredRoles: UserRole[] = [];

  /**
   * @description Executes the ping logic.
   * Calculates the difference between the message timestamp and current server time.
   *
   * @async
   * @param {WASocket} sock The WebSocket connection object.
   * @param {WAMessage} msg The message object triggering the command.
   * @param {string[]} _args Arguments passed by the user (unused here).
   * @returns {Promise<void>}
   */
  async execute(sock: WASocket, msg: WAMessage, _args: string[]): Promise<void> {
    const remoteJid: string = msg.key.remoteJid!;

    // Capture the start time of the command execution
    const startTime: number = Date.now();

    // Determine the timestamp when the message was actually sent by the user
    const messageTimestamp: number =
      typeof msg.messageTimestamp === 'number'
        ? msg.messageTimestamp * 1000
        : (msg.messageTimestamp?.toNumber() || 0) * 1000;

    // Calculate Latency (Time taken for message to reach server)
    // We use Math.max to avoid negative numbers if clocks are slightly out of sync
    const latency: number = Math.max(0, Date.now() - messageTimestamp);

    // Calculate Response Speed (Processing time within the bot)
    const responseSpeed: number = Date.now() - startTime;

    /**
     * @description Formats the output using the standard box design.
     */
    const replyText: string = `┌──「 *Server Speed* 」

    Latency   : ${latency}ms
    Response  : ${responseSpeed}ms

└──「 *Pong* 」`;

    await sock.sendMessage(remoteJid, { text: replyText });
  }
}

/**
 * @description Exports the instance of PingCommand.
 */
export default new PingCommand();
