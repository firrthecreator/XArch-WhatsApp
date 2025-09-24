/**
 * @file .prettierrc.js
 * @description Prettier configuration for ensuring consistent code style across the project.
 * @see {@link https://prettier.io/docs/en/options.html Prettier Options}
 */

// @ts-check

/**
 * @type {import("prettier").Config}
 * @description The main Prettier configuration object. This object defines a
 * comprehensive set of rules for formatting code files to maintain uniformity.
 * The properties within this object control various aspects of the formatting process,
 * from line length to comma styles and quote usage.
 */
const config = {
  /**
   * @type {boolean}
   * @description Controls the printing of semicolons at the ends of statements.
   * A value of `true` will ensure semicolons are always included.
   * Setting this to `false` will omit semicolons at the end of statements.
   */
  semi: true,

  /**
   * @type {boolean}
   * @description Specifies the type of quotes to use for string literals.
   * When set to `true`, all string literals will be formatted with single quotes.
   * A value of `false` will enforce the use of double quotes.
   */
  singleQuote: true,

  /**
   * @type {number}
   * @description Defines the maximum line length that Prettier will wrap on.
   * Lines exceeding this number will be wrapped to a new line where possible
   * to improve readability and prevent horizontal scrolling.
   */
  printWidth: 100,

  /**
   * @type {boolean}
   * @description Determines the character used for indentation.
   * If `true`, Prettier will indent lines using tab characters.
   * When set to `false`, it will use spaces for all indentation.
   */
  useTabs: false,

  /**
   * @type {number}
   * @description Specifies the number of spaces per indentation level.
   * This setting is only effective when `useTabs` is `false`. A value of `2`
   * means each new indentation level will be two spaces.
   */
  tabWidth: 2,

  /**
   * @type {'all' | 'es5' | 'none'}
   * @description Controls the printing of trailing commas in multi line structures.
   * 'all': Prints trailing commas wherever possible, which is useful for version control diffs.
   * 'es5': Prints trailing commas in valid ES5 locations (e.g., objects, arrays).
   * 'none': Never prints trailing commas.
   */
  trailingComma: 'all',

  /**
   * @type {boolean}
   * @description Determines if spaces should be included between brackets in object literals.
   * A value of `true` formats objects with spaces, such as `{ key: 'value' }`.
   * Setting this to `false` removes the spaces, formatting them as `{key: 'value'}`.
   */
  bracketSpacing: true,

  /**
   * @type {'always' | 'avoid'}
   * @description Controls the use of parentheses around a sole arrow function parameter.
   * 'always': Always includes parentheses, for example `(x) => x`.
   * 'avoid': Omits parentheses when a single parameter is present, as in `x => x`.
   */
  arrowParens: 'always',

  /**
   * @type {'lf' | 'crlf' | 'cr' | 'auto'}
   * @description Enforces a consistent line ending style.
   * 'lf': Line Feed, common on Linux and macOS.
   * 'crlf': Carriage Return and Line Feed, standard on Windows.
   * 'cr': Carriage Return, legacy style for Mac OS 9 and older.
   * 'auto': Prettier will preserve existing line endings.
   */
  endOfLine: 'lf',

  /**
   * @type {boolean}
   * @description Controls the placement of the closing angle bracket for JSX elements.
   * If `true`, the closing bracket will be placed on the same line as the last prop.
   * If `false`, it will be placed on a new line after the last prop.
   */
  // jsxBracketSameLine: false,

  /**
   * @type {Array<string | import("prettier").Plugin>}
   * @description A list of Prettier plugins to load. Plugins extend Prettier's
   * functionality to support additional languages or formatting rules.
   * You can add packages here, for example, `prettier plugin go template`.
   */
  plugins: [],
};

module.exports = config;
