/**
 * @file PingCommand.ts
 * @description Defines the logic for the Ping command, which measures latency, API speed, uptime, and server load to monitor bot responsiveness and health.
 */

import { WAMessage, WASocket } from 'baileys';
import { Command } from '../../../types/libs/core/handlers/CommandHandler';
import os from 'os';
import { PingData } from '../../../types/libs/core/commands/PingCommand';

/**
 * @class PingCommand
 * @implements {Command}
 * @description A command to measure the bot's responsiveness and provide basic server health information.
 */
class PingCommand implements Command {
  /**
   * @property {string} The primary name of the command.
   */
  name = 'ping';

  /**
   * @property {string[]} An array of alternative names for the command.
   */
  aliases = ['p'];

  /**
   * @property {string} A brief description of the command's purpose.
   */
  description = "Checks the bot's latency and response speed.";

  /**
   * @property {any[]} An array of required roles to execute this command. Empty means public.
   */
  requiredRoles = [];

  /**
   * Formats a duration in seconds into a human-readable string (D H M S).
   * @private
   * @param {number} seconds - The total seconds to format.
   * @returns {string} The formatted uptime string (e.g., "1d 2h 3m 4s").
   */
  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  }

  /**
   * Executes the core logic of the ping command.
   * It calculates latency based on the message timestamp and measures the internal processing speed.
   * @public
   * @async
   * @param {WASocket} sock - The Baileys socket instance.
   * @param {WAMessage} msg - The message object that triggered the command.
   * @returns {Promise<void>} A promise that resolves once the reply has been sent.
   */
  async execute(sock: WASocket, msg: WAMessage): Promise<void> {
    const startTime = Date.now();
    const remoteJid = msg.key.remoteJid!;

    const sentTimestamp =
      typeof msg.messageTimestamp === 'number'
        ? msg.messageTimestamp * 1000
        : msg.messageTimestamp?.toNumber()! * 1000;

    const latency = startTime - sentTimestamp;
    const apiSpeed = Date.now() - startTime;
    const uptime = this.formatUptime(process.uptime());
    const loadAvg = os
      .loadavg()
      .map((avg) => avg.toFixed(2))
      .join(', ');

    const pingData: PingData = {
      latency,
      apiSpeed,
      uptime,
      loadAvg,
    };

    const replyText = `
⟨⟨ *Pong!* ⟩⟩

*› Latency:* ${pingData.latency} ms
*› API Speed:* ${pingData.apiSpeed} ms
*› Uptime:* ${pingData.uptime}
*› Server Load:* ${pingData.loadAvg}
`.trim();

    await sock.sendMessage(remoteJid, { text: replyText });
  }
}

export default new PingCommand();
