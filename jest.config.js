/**
 * @file jest.config.js
 * @description Jest configuration file for TypeScript projects.
 * @see {@link https://jestjs.io/docs/configuration Jest Configuration}
 */

// @ts-check

/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 * @description The main Jest configuration object. This object defines a
 * comprehensive set of rules and settings for running tests in a project.
 * It specifies the testing environment, file paths, transformers, and reporting options.
 */
const config = {
  /**
   * @type {string}
   * @description A string referencing a predefined Jest configuration.
   * Using 'ts jest' provides a solid base for testing TypeScript code
   * with a preconfigured transformer and other necessary settings.
   */
  preset: 'ts-jest',

  /**
   * @type {string}
   * @description The test environment that Jest will use for running tests.
   * The 'node' environment simulates a Node.js context and is ideal for
   * testing backend or server side code without a browser.
   */
  testEnvironment: 'node',

  /**
   * @type {string[]}
   * @description A list of paths to modules that are executed after the test
   * environment is set up but before each test file is run. This is useful
   * for setting up global variables, test hooks, or mocking frameworks.
   */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  /**
   * @type {string[]}
   * @description An array of glob patterns that Jest uses to locate test files.
   * This setting tells Jest where to look for your test files across the project.
   */
  testMatch: ['**/tests/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],

  /**
   * @type {object}
   * @description A map of regular expressions to transformer modules.
   * Transformers convert source files from one format to another. Here,
   * 'ts jest' is used to transform TypeScript and TSX files into
   * standard JavaScript before they are executed by Jest.
   */
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  /**
   * @type {string[]}
   * @description An array of regular expression patterns Jest uses to ignore
   * certain paths when searching for test files. This is used to skip directories
   * that do not contain tests, such as compiled output or dependency folders.
   */
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'BaileysService.test.ts', 'index.test.ts'],

  /**
   * @type {string[]}
   * @description An array of file extensions that Jest will look for when
   * resolving modules. The order determines resolution priority.
   */
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  /**
   * @type {boolean}
   * @description Indicates whether Jest should collect and report code coverage
   * information during the test run. Code coverage measures how much of your
   * source code is executed by the tests.
   */
  collectCoverage: true,

  /**
   * @type {string}
   * @description The directory where Jest will place all of its code coverage
   * output files. The reports generated here can be used to analyze code quality.
   */
  coverageDirectory: 'coverage',
};

module.exports = config;
