import BaileysService from '../../../src/libs/core/BaileysService';
import { CommandHandler } from '../../../src/libs/core/handlers/CommandHandler';
import { MongoService } from '../../../src/libs/databases/MongoService';

jest.mock('../../../src/libs/core/handlers/CommandHandler');
jest.mock('../../../src/libs/databases/MongoService');

describe('BaileysService', () => {
  let service: BaileysService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BaileysService();
  });

  it('should initialize without throwing error', async () => {
    await expect(service.initialize()).resolves.not.toThrow();
  });

  it('should retry connection on disconnect', async () => {
    const spy = jest.spyOn(service as any, 'initialize');
    (service as any).reconnectInterval = 10; // speed up test

    // simulate close event
    const fakeSocket = {
      ev: {
        on: (event: string, cb: Function) => {
          if (event === 'connection.update') {
            cb({ connection: 'close' });
          }
        },
      },
    };

    (service as any).sock = fakeSocket;
    await service.initialize();

    // wait for reconnection logic
    await new Promise((r) => setTimeout(r, 20));

    expect(spy).toHaveBeenCalledTimes(2); // first call + 1 retry
  });

  it('should start and load commands', async () => {
    const handler = new CommandHandler();
    const loadSpy = jest.spyOn(handler, 'loadCommands');
    const messageSpy = jest.spyOn(handler, 'handleMessage');

    service['commandHandler'] = handler;

    await service.initialize();

    // simulate incoming message
    const message = { key: {}, message: { conversation: '.ping' } };
    await (service as any).sock.ev.emit('messages.upsert', { messages: [message] });

    expect(loadSpy).toHaveBeenCalled();
    expect(messageSpy).toHaveBeenCalled();
  });
});
