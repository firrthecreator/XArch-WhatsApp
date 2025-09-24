/**
 * @file check-node-version.test.ts
 * @description Test suite for the `enforceNodeVersion` function.
 * This suite verifies that the function correctly enforces minimum Node.js major version requirements,
 * throwing errors when conditions are not met, and doing nothing otherwise.
 * Mocks are used for `console.error` to capture output.
 */

/**
 * @description Imports the `enforceNodeVersion` function to be tested.
 */
import { enforceNodeVersion } from '../../src/utils/check-node-version';

/**
 * @description This section sets up all the necessary mock functions and variables for the test suite.
 * Mocking allows for isolated and predictable testing of the function's behavior without relying on
 * the actual Node.js environment or its console output.
 */

/**
 * @type {jest.SpyInstance<void, unknown[], any>}
 * @description Mocks `console.error` to capture error messages without printing them to the test console.
 * This is done using a spy, which allows us to assert whether the method was called and with what arguments.
 */
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

/**
 * @type {string}
 * @description Stores the original `process.version` value to restore it after all tests have completed.
 * This ensures that the test environment is returned to its original state, preventing side effects
 * on other tests.
 */
const originalProcessVersion = process.version;

/**
 * @describe Test suite for `enforceNodeVersion`.
 * This block contains a series of test cases to validate the version enforcement logic.
 * The tests cover a wide range of scenarios, including sufficient versions, too low versions,
 * and invalid input.
 */
describe('enforceNodeVersion', () => {
  /**
   * @beforeEach
   * @description A Jest hook that runs before each individual test case. It is used here to
   * clear all mock calls on `console.error` to ensure that each test starts with a fresh state.
   */
  beforeEach(() => {
    mockConsoleError.mockClear();
  });

  /**
   * @afterAll
   * @description A Jest hook that runs once after the entire test suite has completed.
   * It is used to restore all mocked functionalities, including the original
   * implementation of `process.version` and `console.error`.
   */
  afterAll(() => {
    Object.defineProperty(process, 'version', {
      value: originalProcessVersion,
    });
    mockConsoleError.mockRestore();
  });

  /**
   * @test
   * @description Verifies that `enforceNodeVersion` does not throw or log an error
   * when the current Node.js version is exactly the `requiredMajorVersion`.
   * This test ensures the function behaves as expected in a valid scenario.
   */
  it('should not throw or log an error if the Node.js version is sufficient', () => {
    Object.defineProperty(process, 'version', { value: 'v22.0.0' });

    expect(() => {
      enforceNodeVersion({
        requiredMajorVersion: 22,
      });
    }).not.toThrow();

    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  /**
   * @test
   * @description Verifies that `enforceNodeVersion` does not throw or log an error
   * when the current Node.js version is higher than the `requiredMajorVersion`.
   * This ensures that newer, compatible versions of Node.js are not blocked.
   */
  it('should not throw or log an error if the Node.js version is higher than required', () => {
    Object.defineProperty(process, 'version', { value: 'v23.1.0' });

    expect(() => {
      enforceNodeVersion({
        requiredMajorVersion: 22,
      });
    }).not.toThrow();

    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  /**
   * @test
   * @description Verifies that `enforceNodeVersion` throws a specific error
   * when the current Node.js version is too low. It also checks the content of
   * the thrown error message.
   */
  it('should throw if the Node.js version is too low', () => {
    const outdatedVersion = 'v20.11.0';
    Object.defineProperty(process, 'version', { value: outdatedVersion });

    expect(() => {
      enforceNodeVersion({
        requiredMajorVersion: 22,
      });
    }).toThrow(
      `[Node Version Check] Unsupported Node.js version.\nRequired: v22.x or newer\nCurrent: ${outdatedVersion}`,
    );
  });

  /**
   * @test
   * @description Verifies that `enforceNodeVersion` throws an error if
   * `requiredMajorVersion` is invalid. This tests the function's internal
   * input validation logic.
   */
  it('should throw if requiredMajorVersion is invalid', () => {
    Object.defineProperty(process, 'version', { value: 'v22.0.0' });

    expect(() => {
      enforceNodeVersion({
        requiredMajorVersion: 10, // invalid since we enforce >=18
      });
    }).toThrow(
      `[Node Version Check] Invalid argument: 'requiredMajorVersion' must be a number >= 18. Received: 10`,
    );
  });
});
