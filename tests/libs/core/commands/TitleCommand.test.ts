/**
 * @file TitleCommand.test.ts
 * @description Unit tests for the TitleCommand class using Jest.
 * Updated to match the styled output format (boxes and bold text) of the main command.
 */

import { WAMessage, WASocket } from 'baileys';
import TitleCommand from '../../../../src/libs/core/commands/TitleCommand';
import { MongoService } from '../../../../src/libs/databases/MongoService';

// 1. Mock dependencies
jest.mock('../../../../src/libs/databases/MongoService', () => ({
  MongoService: {
    find: jest.fn(),
    updateOne: jest.fn(),
  },
}));

describe('TitleCommand', () => {
  let mockSock: Partial<WASocket>;
  let mockMsg: WAMessage;
  const senderId = '628123456789@s.whatsapp.net';

  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error during tests to keep output clean
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockSock = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };

    mockMsg = {
      key: {
        remoteJid: senderId,
        fromMe: false,
      },
      pushName: 'TestUser',
    } as WAMessage;
  });

  afterEach(() => {
    // Restore console.error after each test
    (console.error as jest.Mock).mockRestore();
  });

  describe('Basic Properties', () => {
    it('should have the correct name and aliases', () => {
      expect(TitleCommand.name).toBe('title');
      expect(TitleCommand.aliases).toContain('settitle');
      expect(TitleCommand.description).toBeDefined();
    });
  });

  describe('User Validation', () => {
    it('should send error if user is not found in database', async () => {
      (MongoService.find as jest.Mock).mockResolvedValue([]);

      await TitleCommand.execute(mockSock as WASocket, mockMsg, []);

      expect(mockSock.sendMessage).toHaveBeenCalledWith(senderId, {
        text: 'User data not found in database.',
      });
    });
  });

  describe('Listing Titles (No Arguments)', () => {
    it('should inform user if they own no titles', async () => {
      (MongoService.find as jest.Mock).mockResolvedValue([
        {
          id: senderId,
          customization: { titles: { owned: [], active: null } },
        },
      ]);

      await TitleCommand.execute(mockSock as WASocket, mockMsg, []);

      // Check for part of the empty list message
      expect(mockSock.sendMessage).toHaveBeenCalledWith(
        senderId,
        expect.objectContaining({
          text: expect.stringContaining('You do not own any titles yet'),
        }),
      );
    });

    it('should list owned titles and highlight the active one (Styled Format)', async () => {
      (MongoService.find as jest.Mock).mockResolvedValue([
        {
          id: senderId,
          customization: {
            titles: {
              owned: ['Novice', 'Pro', 'Master'],
              active: 'Pro',
            },
          },
        },
      ]);

      await TitleCommand.execute(mockSock as WASocket, mockMsg, []);

      const expectedTextCall = (mockSock.sendMessage as jest.Mock).mock.calls[0][1].text;

      // ✅ Updated to match the box formatting and markdown in your code
      expect(expectedTextCall).toContain('┌──「 *Your Titles* 」');
      expect(expectedTextCall).toContain('1. Novice');
      expect(expectedTextCall).toContain('2. Pro *(Active)*'); // Checks for bold formatting
      expect(expectedTextCall).toContain('3. Master');
      expect(expectedTextCall).toContain('└──「 *How to equip* 」');
    });
  });

  describe('Equipping Titles (With Arguments)', () => {
    const setupUserWithTitles = (active = 'Novice') => {
      (MongoService.find as jest.Mock).mockResolvedValue([
        {
          id: senderId,
          customization: {
            titles: {
              owned: ['Novice', 'Pro', 'God'],
              active: active,
            },
          },
        },
      ]);
    };

    it('should show error for invalid number (NaN)', async () => {
      setupUserWithTitles();
      await TitleCommand.execute(mockSock as WASocket, mockMsg, ['invalid']);

      expect(mockSock.sendMessage).toHaveBeenCalledWith(
        senderId,
        expect.objectContaining({
          text: expect.stringContaining('Invalid selection'),
        }),
      );
    });

    it('should show error for number out of range', async () => {
      setupUserWithTitles();
      await TitleCommand.execute(mockSock as WASocket, mockMsg, ['99']);

      expect(mockSock.sendMessage).toHaveBeenCalledWith(
        senderId,
        expect.objectContaining({
          text: expect.stringContaining('Invalid selection'),
        }),
      );
    });

    it('should show message if title is already active', async () => {
      setupUserWithTitles('Pro');
      await TitleCommand.execute(mockSock as WASocket, mockMsg, ['2']);

      expect(mockSock.sendMessage).toHaveBeenCalledWith(senderId, {
        text: 'The title "Pro" is already equipped.',
      });
      expect(MongoService.updateOne).not.toHaveBeenCalled();
    });

    it('should successfully equip a new title', async () => {
      setupUserWithTitles('Novice');

      // User wants to equip 'God'
      await TitleCommand.execute(mockSock as WASocket, mockMsg, ['3']);

      expect(MongoService.updateOne).toHaveBeenCalledWith(
        'users',
        { id: senderId },
        { $set: { 'customization.titles.active': 'God' } },
      );

      // ✅ Updated to match the bold markdown in your success message
      expect(mockSock.sendMessage).toHaveBeenCalledWith(senderId, {
        text: 'Successfully equipped title: *God*',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const dbError = new Error('DB Connection Failed');
      (MongoService.find as jest.Mock).mockRejectedValue(dbError);

      await TitleCommand.execute(mockSock as WASocket, mockMsg, []);

      expect(console.error).toHaveBeenCalledWith('Error in TitleCommand:', dbError);

      expect(mockSock.sendMessage).toHaveBeenCalledWith(senderId, {
        text: 'An unexpected error occurred while managing your titles.',
      });
    });
  });
});
