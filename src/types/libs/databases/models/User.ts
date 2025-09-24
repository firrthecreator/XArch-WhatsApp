/**
 * @file User.ts
 * @description A comprehensive file containing all type definitions for a user
 * document and its related data structures. This ensures that the user schema is
 * strictly enforced, providing strong type safety, consistency, and readability.
 */

/**
 * @enum UserRole
 * @description Defines the possible roles a user can have within the system.
 * Using an enum is a highly scalable and type safe approach, providing a clear
 * and limited set of permissions for user accounts.
 */
export enum UserRole {
  /** A developer with full access to all features. */
  DEVELOPER = 'developer',
  /** A moderator responsible for community management and enforcing rules. */
  MODERATOR = 'moderator',
  /** A user with premium subscription benefits. */
  PREMIUM = 'premium',
}

/**
 * @interface IPartnerInfo
 * @description Represents information about a user's current or past partner.
 * This structured interface ensures consistent data representation for partner details.
 */
export interface IPartnerInfo {
  /** The unique identifier for the partner, typically a platform specific ID. */
  id: string;
  /** The display name of the partner. */
  name: string;
  /** The URL to the partner's profile. */
  url: string;
  /** The URL of the partner's profile image. */
  imageUrl: string;
}

/**
 * @interface IInventoryItem
 * @description A generic structure for items in a user's inventory.
 * This provides a flexible way to represent various items with a common set of properties.
 */
export interface IInventoryItem {
  /** A unique identifier for the item type. */
  id: string;
  /** The display name of the item. */
  name: string;
  /** The number of this item the user possesses. */
  quantity: number;
}

/**
 * @interface IUser
 * @description Represents the complete, refactored data structure for a user account,
 * maintaining all data fields from the original schema with improved naming and structure.
 * This is the root schema for a user document in the database.
 */
export interface IUser {
  /**
   * @property {string} id
   * @description The primary unique identifier for the user.
   */
  id: string;

  /**
   * @property {object} profile
   * @description Core user profile and credential information.
   */
  profile: {
    /** The user's public username. */
    username: string;
    /** The user's password, which should always be stored as a hash. */
    passwordHash: string;
    /** The user's email address. */
    email: string;
    /** The ISO 8601 timestamp of when the user account was created. */
    createdAt: string;
    /** The user's gender, which is an optional field. */
    gender: 'male' | 'female' | 'other' | 'undisclosed';
  };

  /**
   * @property {object} settings
   * @description User configurable application settings.
   */
  settings: {
    /** The user's preferred language. */
    language: string;
    /** A flag indicating if button commands are enabled. */
    buttonCommandsEnabled: boolean;
    /** A flag indicating if a fixed number format is enabled. */
    fixedNumberFormatEnabled: boolean;
    /** A flag indicating if the user's account has been verified. */
    isVerified: boolean;
    /** A flag indicating if the user has a premium verified status. */
    isPremiumVerified: boolean;
  };

  /**
   * @property {UserRole[]} roles
   * @description An array of roles assigned to the user.
   */
  roles: UserRole[];

  /**
   * @property {object} relationship
   * @description Data for the user's romantic relationship simulation.
   */
  relationship: {
    /** Information about the user's current partner. */
    partnerInfo: IPartnerInfo | null;
    /** The current relationship status. */
    status: 'single' | 'dating' | 'engaged' | 'married';
    /** The ISO 8601 timestamp of when the current relationship started. */
    startDate: string | null;
    /** A flag indicating if the user is pregnant. */
    isPregnant: boolean;
    /** An array of structured inventory items representing children. */
    children: IInventoryItem[];
    /** The relationship level. */
    level: number;
    /** The total relationship points. */
    points: number;
    /** An array of past partners. */
    exPartners: IPartnerInfo[];
    /** Cooldowns for relationship related actions. */
    cooldowns: {
      /** Unix timestamp for the next available interaction. */
      interaction: number;
      /** Unix timestamp for the next available image change. */
      setImage: number;
    };
  };

  /**
   * @property {object} inventory
   * @description The user's personal inventory.
   */
  inventory: {
    /** The amount of in game money the user possesses. */
    money: number;
    /** Information about the user's food inventory. */
    food: {
      /** Food points. */
      points: number;
      /** An array of food items. */
      items: IInventoryItem[];
    };
    /** Information about the user's drink inventory. */
    drink: {
      /** Drink points. */
      points: number;
      /** An array of drink items. */
      items: IInventoryItem[];
    };
    /** Information about the user's gift inventory. */
    gifts: {
      /** An array of gift items. */
      items: IInventoryItem[];
    };
  };

  /**
   * @property {object} economy
   * @description All data related to the user's general in game economy.
   */
  economy: {
    /** The user's cash and fiat currency balance. */
    balance: {
      /** Standard in game currency. */
      money: number;
      /** Premium or secondary currency. */
      fiat: number;
    };
    /** The user's economy level. */
    level: number;
    /** The user's experience points towards the next level. */
    experience: number;
    /** The active experience booster multiplier, e.g., 1.5 for a 50 percent boost. */
    activeExperienceBooster: number;
    /** The user's assets, including investments and properties. */
    assets: {
      /** An array of investment assets represented by their IDs. */
      investments: string[];
      /** An array of property assets represented by their IDs. */
      properties: string[];
    };
    /** Cooldowns for economic actions. */
    cooldowns: {
      /** Unix timestamp for the next available mining action. */
      mining: number;
      /** Unix timestamp for the next available airdrop claim. */
      airdrop: number;
    };
  };

  /**
   * @property {object} customization
   * @description User's cosmetic and profile appearance settings.
   */
  customization: {
    /** The URL of the user's profile image. */
    profileImageUrl: string;
    /** The URL of the user's background image. */
    backgroundImageUrl: string;
    /** Data related to the user's profile borders. */
    borders: {
      /** An array of owned border IDs. */
      owned: string[];
      /** The currently active border ID. */
      active: string | null;
    };
    /** Data related to the user's profile titles. */
    titles: {
      /** An array of owned title IDs. */
      owned: string[];
      /** The currently active title ID. */
      active: string | null;
    };
  };

  /**
   * @property {object} status
   * @description Current state of the user account.
   */
  status: {
    /** Information about the user's away from keyboard status. */
    afk: {
      /** A flag indicating if the user is currently AFK. */
      isActive: boolean;
      /** The reason for being AFK. */
      reason: string | null;
      /** The duration in seconds. */
      duration: number;
    };
    /**
     * @description Information about the user's ban status.
     * This is `null` if the user is not banned.
     */
    ban: {
      /** A flag indicating if the ban is currently active. */
      isActive: boolean;
      /** A flag indicating if the ban is permanent. */
      isPermanent: boolean;
      /** The reason for the ban. */
      reason: string | null;
      /** The duration of the ban in seconds. This will be 0 if the ban is permanent. */
      duration: number;
      /** Unix timestamp of when the ban was issued. */
      timestamp: number;
      /** The ID of the admin user who issued the ban. */
      bannedBy: string | null;
      /** An array of command names that are restricted for this user. */
      restrictedCommands: string[];
      /** Descriptions of past bans for this user. */
      history: string[];
    } | null;
  };

  /**
   * @property {object} cryptoWallet
   * @description The user's in game cryptocurrency holdings.
   */
  cryptoWallet: {
    /** The amount of Bitcoin. */
    bitcoin: number;
    /** The amount of Ethereum. */
    ethereum: number;
    /** The amount of Tether. */
    tether: number;
    /** The amount of Binance Coin. */
    binance: number;
    /** The amount of Dogecoin. */
    dogecoin: number;
    /** The amount of Solana. */
    solana: number;
  };

  /**
   * @property {object} residence
   * @description User's primary residence details. This is `null` if the user has no residence.
   */
  residence: {
    /** The unique identifier for the residence. */
    id: string;
    /** The price of the residence. */
    price: number;
    /** The name of the residence's owner. */
    ownerName: string;
    /** The location of the residence. */
    location: {
      /** The country of the residence. */
      country: string;
      /** The city of the residence. */
      city: string;
      /** The street address of the residence. */
      address: string;
    };
    /** An array of amenities available at the residence. */
    amenities: string[];
  } | null;

  /**
   * @property {object} social
   * @description User's social media links and in app connections.
   */
  social: {
    /** A list of links to the user's social media profiles. */
    links: {
      /** The Facebook profile link. */
      facebook: string | null;
      /** The Instagram profile link. */
      instagram: string | null;
      /** The TikTok profile link. */
      tiktok: string | null;
    };
    /** The user's social network connections within the application. */
    connections: {
      /** An array of user IDs that the current user is following. */
      following: string[];
      /** An array of user IDs who follow the current user. */
      followers: string[];
      /** An array of user IDs who are friends with the current user. */
      friends: string[];
    };
  };

  /**
   * @property {object} messaging
   * @description User's messaging related status and limits.
   */
  messaging: {
    /** The user's messaging rate limit settings. */
    rateLimit: {
      /** A flag indicating if the rate limit is enabled. */
      isEnabled: boolean;
      /** The current message count within the time window. */
      messageCount: number;
      /** The timestamp of the last message sent. */
      lastMessageTimestamp: number;
      /** The maximum number of messages allowed in the time window. */
      maxMessages: number;
      /** The time window in milliseconds for the rate limit. */
      timeWindowMs: number;
    };
  };

  /**
   * @property {object} linkedAccounts
   * @description External or alternate accounts linked to this user.
   */
  linkedAccounts: {
    /** A list of owned linked account IDs. */
    owned: string[];
    /** The currently active linked account ID. */
    active: string | null;
  };
}
