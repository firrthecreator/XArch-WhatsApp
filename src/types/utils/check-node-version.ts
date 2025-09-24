/**
 * @file check-node-version.ts
 * @description Contains type definitions for the Node.js version checking module.
 * This file defines the structure of configuration options used by the version
 * enforcement utility, providing type safety and clear documentation for its API.
 */

/**
 * @interface NodeVersionOptions
 * @summary Defines the options for the Node.js version enforcement function.
 * @description This interface specifies the optional minimum Node.js major version
 * that the application requires to run, ensuring the version check utility is used
 * with the correct data structure.
 */
export interface NodeVersionOptions {
  /**
   * @property {number} [requiredMajorVersion]
   * @description The minimum required major version number of Node.js. This property
   * is optional. If it is not provided, the version check function will use its
   * internal default value, which is `18`. This is used to ensure the application
   * runs in a compatible Node.js environment.
   * @example 20
   */
  requiredMajorVersion?: number;
}
