/**
 * @file check-node-version.ts
 * @description A utility module for checking and enforcing the Node.js major version.
 * It provides a simple function to ensure the runtime environment meets the minimum
 * version requirements for the application, preventing potential compatibility issues.
 */

/**
 * @description Imports the `NodeVersionOptions` type, which is used to
 * define the configurable options for the version check function.
 */
import type { NodeVersionOptions } from '../types/utils/check-node-version';

/**
 * @description Enforces a minimum Node.js major version.
 * This function validates the provided options and then compares the current
 * Node.js version against the required minimum. It is an essential check for
 * applications that depend on features from a specific Node.js release.
 *
 * @param {NodeVersionOptions} options An object containing the required major version.
 * @param {number} options.requiredMajorVersion The minimum Node.js major version
 * that is required to run the application. The default value is `18`.
 * @throws {Error} Throws an error if the `requiredMajorVersion` parameter is invalid
 * or if the current Node.js version is older than the required version.
 */
export function enforceNodeVersion({ requiredMajorVersion = 18 }: NodeVersionOptions): void {
  /**
   * @description Checks for invalid input. This first validation step ensures that the
   * `requiredMajorVersion` is a number and is at least `18`. An early error is
   * thrown to prevent incorrect usage of the function.
   */
  if (typeof requiredMajorVersion !== 'number' || requiredMajorVersion < 18) {
    throw new Error(
      `[Node Version Check] Invalid argument: 'requiredMajorVersion' must be a number >= 18. Received: ${requiredMajorVersion}`,
    );
  }

  /**
   * @description Extracts the current Node.js major version number from the
   * `process.version` string. The string is processed by removing the initial 'v',
   * splitting the version numbers by the dot, and then taking the first part as a number.
   */
  const currentMajorVersion = parseInt(process.version.slice(1).split('.')[0], 10);

  /**
   * @description Compares the current major version to the required major version.
   * If the current version is found to be too low, a descriptive error is thrown
   * to inform the user about the version incompatibility.
   */
  if (currentMajorVersion < requiredMajorVersion) {
    throw new Error(
      `[Node Version Check] Unsupported Node.js version.\nRequired: v${requiredMajorVersion}.x or newer\nCurrent: ${process.version}`,
    );
  }
}
