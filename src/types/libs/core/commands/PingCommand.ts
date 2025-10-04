/**
 * @file PingCommand.ts
 * @description Defines the structure of data collected by the Ping command, including latency, API speed, uptime, and system load average.
 */

/**
 * @interface PingData
 * @description Represents the structured data collected by the ping command before it is formatted for display.
 */
export interface PingData {
  /**
   * @property {number}
   * @description The total time in milliseconds between the user sending the message and the bot processing it.
   */
  latency: number;

  /**
   * @property {number}
   * @description The internal processing time in milliseconds for the command to execute on the server.
   */
  apiSpeed: number;

  /**
   * @property {string}
   * @description A human-readable string representing the total uptime of the bot process.
   */
  uptime: string;

  /**
   * @property {string}
   * @description A string representing the server's load average over the last 1, 5, and 15 minutes.
   */
  loadAvg: string;
}
