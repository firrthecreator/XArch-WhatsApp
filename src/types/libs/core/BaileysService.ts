/**
 * @file BaileysService.ts
 * @description Type definitions for authentication related processes and user input.
 * This file defines the standardized interfaces used for managing authentication
 * state, user login choices, and phone number input, ensuring a consistent
 * and type safe approach to handling authentication flows.
 */

/**
 * @description Imports the `AuthenticationState` type from the `baileys` library,
 * which is a fundamental component for storing and managing user session credentials.
 */
import type { AuthenticationState } from 'baileys';

/**
 * @interface AuthState
 * @description Represents the authentication state object used to store and manage
 * a user's session credentials. This interface provides a clean contract for handling
 * the session data and the function required to persist it.
 * @property {AuthenticationState} state The current authentication state containing
 * the session keys and credentials.
 * @property {() => Promise<void>} saveCreds A function to securely save the credentials
 * to a persistent storage medium.
 */
export interface AuthState {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}

/**
 * @interface LoginChoice
 * @description Represents the user's choice of authentication method.
 * This interface is used to capture the selected method, ensuring that the
 * application proceeds with the correct login flow.
 * @property {'Pairing Code (Recommended)' | 'QR Code'} choice The user's selected
 * login method.
 */
export interface LoginChoice {
  choice: 'Pairing Code (Recommended)' | 'QR Code';
}

/**
 * @interface PhoneNumberInput
 * @description Represents the input for a user's phone number during the login process.
 * @property {string} phoneNumber The phone number provided by the user, formatted for
 * the authentication request.
 */
export interface PhoneNumberInput {
  phoneNumber: string;
}
