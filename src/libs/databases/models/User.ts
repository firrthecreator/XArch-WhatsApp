/**
 * @file User.ts
 * @description This file defines the `IUser` interface, representing the comprehensive
 * schema for a user document in the database. It also provides a factory function
 * to create a new user object with consistent default values.
 */

/**
 * @description Imports the `IUser` interface and `UserRole` enum, which are used to
 * define the structure and roles of a user document in the database.
 */
import { type IUser } from '../../../types/libs/databases/models/User';

/**
 * @function createUser
 * @description A factory function that creates a new user object with default values,
 * reflecting the full, detailed schema. This ensures every new user starts
 * with a consistent and valid data structure, preventing missing fields in
 * new database entries.
 * @param {string} id The unique identifier for the new user.
 * @returns {IUser} A new user object conforming to the IUser interface, populated
 * with all default properties.
 */
export function createUser(id: string): IUser {
  const now = new Date();

  return {
    id,
    /**
     * @description The user's personal profile information.
     */
    profile: {
      /** The user's public username. */
      username: '',
      /** The hashed password for user authentication. */
      passwordHash: '',
      /** The user's email address. */
      email: '',
      /** The timestamp of when the user account was created. */
      createdAt: now.toISOString(),
      /** The user's gender, which is an optional field. */
      gender: 'undisclosed',
    },
    /**
     * @description Various user specific settings.
     */
    settings: {
      /** The user's preferred language. */
      language: 'en',
      /** A flag indicating if button commands are enabled. */
      buttonCommandsEnabled: false,
      /** A flag indicating if a fixed number format is enabled. */
      fixedNumberFormatEnabled: false,
      /** A flag indicating if the user's account has been verified. */
      isVerified: false,
      /** A flag indicating if the user has a premium verified status. */
      isPremiumVerified: false,
    },
    /**
     * @description An array of roles assigned to the user, such as 'admin' or 'member'.
     */
    roles: [],
    /**
     * @description Data related to the user's relationships and interactions.
     */
    relationship: {
      /** Information about the user's current partner. */
      partnerInfo: null,
      /** The current relationship status, e.g., 'single', 'married'. */
      status: 'single',
      /** The start date of the current relationship. */
      startDate: null,
      /** A flag indicating if the user is pregnant. */
      isPregnant: false,
      /** An array of children associated with the user. */
      children: [],
      /** The relationship level. */
      level: 0,
      /** The total relationship points. */
      points: 0,
      /** An array of past partners. */
      exPartners: [],
      /** Cooldowns for relationship related actions. */
      cooldowns: {
        /** The cooldown for general interactions. */
        interaction: 0,
        /** The cooldown for setting a new image. */
        setImage: 0,
      },
    },
    /**
     * @description The user's in game inventory.
     */
    inventory: {
      /** The amount of in game currency the user possesses. */
      money: 0,
      /** Information about the user's food inventory. */
      food: {
        /** Food points. */
        points: 0,
        /** An array of food items. */
        items: [],
      },
      /** Information about the user's drink inventory. */
      drink: {
        /** Drink points. */
        points: 0,
        /** An array of drink items. */
        items: [],
      },
      /** Information about the user's gift inventory. */
      gifts: {
        /** An array of gift items. */
        items: [],
      },
    },
    /**
     * @description The user's economic status and progress.
     */
    economy: {
      /** The user's cash and fiat currency balance. */
      balance: {
        /** The amount of in game money. */
        money: 0,
        /** The amount of fiat currency. */
        fiat: 0,
      },
      /** The user's economy level. */
      level: 1,
      /** The user's experience points towards the next level. */
      experience: 0,
      /** The active experience booster multiplier. */
      activeExperienceBooster: 1.0,
      /** The user's assets, including investments and properties. */
      assets: {
        /** An array of investment assets. */
        investments: [],
        /** An array of property assets. */
        properties: [],
      },
      /** Cooldowns for economic actions. */
      cooldowns: {
        /** The cooldown for mining activities. */
        mining: 0,
        /** The cooldown for airdrop events. */
        airdrop: 0,
      },
    },
    /**
     * @description User profile customization options.
     */
    customization: {
      /** The URL of the user's profile image. */
      profileImageUrl: '../../../../assets/avatar.png',
      /** The URL of the user's background image. */
      backgroundImageUrl: '../../../../assets/banner.png',
      /** Data related to the user's profile borders. */
      borders: {
        /** An array of owned borders. */
        owned: [],
        /** The currently active border. */
        active: null,
      },
      /** Data related to the user's profile titles. */
      titles: {
        /** An array of owned titles. */
        owned: [],
        /** The currently active title. */
        active: null,
      },
    },
    /**
     * @description The user's current status and any related flags.
     */
    status: {
      /** Information about the user's away from keyboard status. */
      afk: {
        /** A flag indicating if the user is currently AFK. */
        isActive: false,
        /** The reason for being AFK. */
        reason: null,
        /** The duration of the AFK status. */
        duration: 0,
      },
      /** Information about the user's ban status. */
      ban: null,
    },
    /**
     * @description The user's in game cryptocurrency wallet.
     */
    cryptoWallet: {
      /** The amount of Bitcoin. */
      bitcoin: 0,
      /** The amount of Ethereum. */
      ethereum: 0,
      /** The amount of Tether. */
      tether: 0,
      /** The amount of Binance Coin. */
      binance: 0,
      /** The amount of Dogecoin. */
      dogecoin: 0,
      /** The amount of Solana. */
      solana: 0,
    },
    /**
     * @description The user's current residence.
     */
    residence: null,
    /**
     * @description The user's social connections and external links.
     */
    social: {
      /** A list of links to the user's social media profiles. */
      links: {
        /** The Facebook profile link. */
        facebook: null,
        /** The Instagram profile link. */
        instagram: null,
        /** The TikTok profile link. */
        tiktok: null,
      },
      /** The user's social network connections. */
      connections: {
        /** An array of users the current user is following. */
        following: [],
        /** An array of users who follow the current user. */
        followers: [],
        /** An array of users who are friends with the current user. */
        friends: [],
      },
    },
    /**
     * @description Messaging related settings and rate limits.
     */
    messaging: {
      /** The user's messaging rate limit settings. */
      rateLimit: {
        /** A flag indicating if the rate limit is enabled. */
        isEnabled: false,
        /** The current message count within the time window. */
        messageCount: 0,
        /** The timestamp of the last message sent. */
        lastMessageTimestamp: 0,
        /** The maximum number of messages allowed in the time window. */
        maxMessages: 20,
        /** The time window in milliseconds for the rate limit. */
        timeWindowMs: 60000,
      },
    },
    /**
     * @description Information about the user's linked external accounts.
     */
    linkedAccounts: {
      /** An array of owned linked accounts. */
      owned: [],
      /** The currently active linked account. */
      active: null,
    },
  };
}
