/**
 * @file EvalCommand.ts
 * @description Type definitions for the `EvalCommand` module. This file defines the
 * standardized interfaces and types used for command execution parameters and
 * status reporting, ensuring a consistent contract for all evaluation related commands.
 */

/**
 * @type ExecutionStatus
 * @description Defines a union type for the execution status of a command. This type
 * provides a clear, limited set of possible outcomes for a command's execution.
 * - `'Successfully'`: The command executed without any errors.
 * - `'Error'`: The command encountered a problem during its execution.
 */
export type ExecutionStatus = 'Successfully' | 'Error';
