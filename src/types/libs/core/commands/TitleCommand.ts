/**
 * @file TitleCommandTypes.ts
 * @description Defines the strict interfaces and types used for the TitleCommand.
 * This ensures type safety when handling user data from the database.
 */

/**
 * @interface ITitleData
 * @description Represents the structure of the titles object within user customization.
 */
export interface ITitleData {
  /** Array of title names owned by the user. */
  owned: string[];
  /** The name of the currently equipped title, or null if none. */
  active: string | null;
}

/**
 * @interface ITitleCustomization
 * @description Represents the specific customization section for titles.
 */
export interface ITitleCustomization {
  titles: ITitleData;
}

/**
 * @interface IUserWithTitles
 * @description A partial representation of the User document, containing only
 * the fields necessary for title management.
 */
export interface IUserWithTitles {
  /** The user's unique identifier (JID). */
  id: string;
  /** Optional customization settings. */
  customization?: ITitleCustomization;
}
