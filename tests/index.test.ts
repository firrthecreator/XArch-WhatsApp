jest.mock('../src/libs/databases/MongoService', () => ({
  MongoService: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../src/libs/core/BaileysService', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  }));
});

const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`Process exited with code ${code}`);
  });

const mockOn = jest.spyOn(process, 'on').mockImplementation(() => process);

describe('App Entry (index.ts)', () => {
  beforeEach(() => {
    jest.resetModules(); // Reset import cache for clean state
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    process.env.MONGO_DB_NAME = 'test-db';
  });

  afterEach(() => {
    mockExit.mockClear();
    mockOn.mockClear();
  });

  it('should start application and initialize services', async () => {
    await import('../src/index');

    const { MongoService } = await import('../src/libs/databases/MongoService');
    const BaileysService = (await import('../src/libs/core/BaileysService')).default;

    expect(MongoService.connect).toHaveBeenCalledWith('mongodb://localhost:27017', 'test-db');
    expect(BaileysService).toHaveBeenCalledTimes(1);
    expect((BaileysService as jest.Mock).mock.instances[0].initialize).toHaveBeenCalled();
  });

  it('should exit if MONGO_URI or DB_NAME is missing', async () => {
    process.env.MONGO_URI = '';
    process.env.MONGO_DB_NAME = '';

    try {
      await import('../src/index');
    } catch (e: any) {
      expect(e.message).toContain('Process exited with code 1');
    }

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should call MongoService.disconnect on SIGINT', async () => {
    const { MongoService } = await import('../src/libs/databases/MongoService');
    const disconnect = MongoService.disconnect as jest.Mock;

    await import('../src/index');

    const sigintHandler = mockOn.mock.calls.find(([signal]) => signal === 'SIGINT')?.[1];
    if (sigintHandler) {
      try {
        await sigintHandler();
      } catch (e: any) {
        expect(e.message).toContain('Process exited with code 0');
      }

      expect(disconnect).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    } else {
      throw new Error('SIGINT handler not registered');
    }
  });

  it('should call MongoService.disconnect on SIGTERM', async () => {
    const { MongoService } = await import('../src/libs/databases/MongoService');
    const disconnect = MongoService.disconnect as jest.Mock;

    await import('../src/index');

    const sigtermHandler = mockOn.mock.calls.find(([signal]) => signal === 'SIGTERM')?.[1];
    if (sigtermHandler) {
      try {
        await sigtermHandler();
      } catch (e: any) {
        expect(e.message).toContain('Process exited with code 0');
      }

      expect(disconnect).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);
    } else {
      throw new Error('SIGTERM handler not registered');
    }
  });
});
