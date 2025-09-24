/**
 * @file jest.setup.js
 * @description This file is executed once before each test file is run within the Jest test suite.
 * It serves as a central place for global configurations, environment setups, and mock definitions.
 * @see {@link https://jestjs.io/docs/configuration#setupfilesafterenv-array Jest setupFilesAfterEnv}
 */

// @ts-check

/**
 * @description This section handles the loading of environment variables for the test suite.
 * It is crucial for ensuring that tests run with the correct configuration without relying
 * on the development or production environments.
 */

/**
 * @type {void}
 * @description Loads environment variables from the specified file. The path
 * '.env.test.local' is used to specifically configure the test environment,
 * keeping it separate from other application configurations. This ensures
 * that tests are isolated and do not have side effects.
 */
require('dotenv').config({ path: '.env.test.local' });

/**
 * @description This section defines global configurations that apply to all tests.
 * This includes settings that control Jest's behavior, such as timeouts.
 */

/**
 * @type {void}
 * @description Sets a global default timeout for tests. The value is specified
 * in milliseconds. A timeout of 10000 means that any test taking longer than
 * ten seconds will automatically fail. This prevents long running tests from
 * blocking the test suite.
 */
jest.setTimeout(10000);

/**
 * @type {void}
 * @description This is an optional line to extend Jest's built in `expect` matchers.
 * The `jest extended` library provides a wide variety of additional matchers
 * that can make assertions more expressive and readable.
 */
// require('jest-extended');

/**
 * @description This section demonstrates how to use global hooks. Global hooks
 * are functions that run once for the entire test suite, either before all tests
 * or after all tests have finished.
 */

/**
 * @type {import('@jest/globals').HookFn<void>}
 * @description A global setup hook that runs once before all test files begin.
 * This is useful for tasks like connecting to a test database or starting a
 * test server. This hook ensures the environment is ready for all subsequent tests.
 */
// beforeAll(async () => {
//    console.log('Connecting to the test database...');
//    // Example: await connectToDatabase();
// });

/**
 * @type {import('@jest/globals').HookFn<void>}
 * @description A global teardown hook that runs once after all test files have completed.
 * This is used for cleanup tasks like disconnecting from a database or closing a server
 * to release resources and ensure a clean exit.
 */
// afterAll(async () => {
//    console.log('Disconnecting from the test database...');
//    // Example: await disconnectFromDatabase();
// });

/**
 * @description This section demonstrates how to create global mocks. Mocks are
 * substitutes for real modules or functions. Global mocks are useful for
 * ensuring tests are isolated from external dependencies.
 */

/**
 * @type {void}
 * @description Globally mocks a module to prevent actual network calls. The
 * `jest mock` function replaces the module at the specified path with a mock
 * implementation. This allows tests to run predictably without external services.
 */
// jest.mock('./src/services/apiClient', () => ({
//    __esModule: true,
//    fetchData: jest.fn(() => Promise.resolve({ data: 'mocked data' })),
// }));
