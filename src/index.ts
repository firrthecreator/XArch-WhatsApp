/**
 * @file index.ts
 * @description This is the main entry point of the application. It is responsible
 * for initializing all core services, connecting to the database, and managing
 * the application's lifecycle, including graceful shutdown.
 */

/**
 * @description Imports the `dotenv` library to load environment variables from
 * a `.env` file into `process.env`.
 */
import dotenv from 'dotenv';
dotenv.config();

/**
 * @description Imports the `BaileysService`, which manages the WhatsApp bot's
 * entire lifecycle, from authentication to message handling.
 */
import BaileysService from './libs/core/BaileysService';

/**
 * @description Imports the `MongoService`, a static utility class for
 * managing the connection to the MongoDB database.
 */
import { MongoService } from './libs/databases/MongoService';

/**
 * @private
 * @description The MongoDB connection URI, loaded from environment variables.
 */
const MONGO_URI = process.env.MONGO_URI;

/**
 * @private
 * @description The name of the MongoDB database to connect to, loaded from
 * environment variables.
 */
const DB_NAME = process.env.MONGO_DB_NAME;

/**
 * @function main
 * @description The primary asynchronous function that orchestrates the application's
 * startup sequence. It performs essential checks, connects to the database,
 * initializes the core services, and sets up signal handlers for graceful termination.
 * @async
 * @returns {Promise<void>} A promise that resolves when the application has started.
 */
async function main() {
  try {
    console.info('[App] Starting application...');

    if (!MONGO_URI || !DB_NAME) {
      throw new Error('Missing MONGO_URI or MONGO_DB_NAME in environment variables.');
    }

    await MongoService.connect(MONGO_URI, DB_NAME);
    console.info('[App] Connected to MongoDB.');

    const baileys = new BaileysService();
    await baileys.initialize();
    console.info('[App] WhatsApp bot is running.');

    // Graceful shutdown handlers
    process.on('SIGINT', async () => {
      console.warn('\n[App] Caught SIGINT. Shutting down...');
      await shutdown();
    });

    process.on('SIGTERM', async () => {
      console.warn('\n[App] Caught SIGTERM. Shutting down...');
      await shutdown();
    });
  } catch (error) {
    console.error('[App] Startup failed:', error);
    process.exit(1);
  }
}

/**
 * @function shutdown
 * @description A utility function to handle the graceful shutdown of the application.
 * It ensures that all services, such as the database connection, are properly
 * closed before the process exits.
 * @async
 * @returns {Promise<void>} A promise that resolves when the shutdown process is complete.
 */
async function shutdown() {
  try {
    await MongoService.disconnect();
    console.info('[App] MongoDB disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('[App] Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the application
main();
