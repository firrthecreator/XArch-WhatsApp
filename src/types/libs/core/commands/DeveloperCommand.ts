/**
 * @file DeveloperCommand.ts
 * @description Type definitions for the `DeveloperCommand` module. This file defines
 * the structured format for the developer's profile information and contact details,
 * ensuring consistency and type safety when presenting this data to the user.
 */

/**
 * @interface DeveloperContacts
 * @description Defines the structure for the developer's various contact and
 * social media links.
 * @property {string} github The URL to the developer's GitHub profile.
 * @property {string} instagram The URL to the developer's Instagram profile.
 * @property {string} whatsappNumber The developer's WhatsApp phone number, typically used
 * for the contact card.
 * @property {string} email The developer's primary email address.
 */
export interface DeveloperContacts {
  github: string;
  instagram: string;
  whatsappNumber: string;
  email: string;
}

/**
 * @interface DeveloperInfo
 * @description Defines the complete structure for the developer's profile information.
 * This interface combines biographical data, skills, and contact details.
 * @property {string} name The developer's full name.
 * @property {string} role The developer's primary role or title (e.g., 'Lead Developer').
 * @property {string} bio A short biography or statement about the developer.
 * @property {string[]} skills An array of key skills or programming languages the
 * developer is proficient in.
 * @property {DeveloperContacts} contacts A nested object containing all contact and
 * social media links, defined by the `DeveloperContacts` interface.
 */
export interface DeveloperInfo {
  name: string;
  role: string;
  bio: string;
  skills: string[];
  contacts: DeveloperContacts;
}
