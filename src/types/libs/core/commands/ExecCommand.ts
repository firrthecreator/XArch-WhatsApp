/**
 * @file ExecCommand.ts
 * @description Type definitions for the `ExecCommand` module. This file defines the
 * standardized status types used for reporting the outcome of a shell command's execution.
 */

/**
 * @type CommandExecutionStatus
 * @description Defines a union type for the execution status of a shell command. This type
 * provides a clear, limited set of possible outcomes for a command's execution.
 * - `'Successfully'`: The command executed without any errors.
 * - `'Error'`: The command encountered a problem during its execution.
 */
export type CommandExecutionStatus = 'Successfully' | 'Error';
