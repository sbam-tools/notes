import { container } from "tsyringe";
import { EncryptLogic } from "./encrypt-logic";
import { EventBridgeService } from "../services/events-service";

describe('lambda/encryptor/EncryptLogic', () => {
  const eventsService = {
    sendMessageDecrypted: jest.fn(),
  };
  const encryptor = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };
  const messagesRepository = {
    create: jest.fn(),
    find: jest.fn(),
  };

  let subject: EncryptLogic;

  beforeEach(() => {
    container.reset();
    jest.resetAllMocks();
    container.registerInstance('IEncryptor', encryptor);
    container.registerInstance('IMessagesRepository', messagesRepository);
    container.registerInstance<unknown>(EventBridgeService, eventsService);
    subject = container.resolve(EncryptLogic);
  });

  describe('#encrypt', () => {
    it('creates a message with a generated id and the encrypted version of a message', async () => {
      let generatedId = Buffer.from('');
      let generatedKey = Buffer.from('');
      encryptor.encrypt.mockImplementation(({ key, iv, message }) => {
        generatedId = iv;
        generatedKey = key;
        expect(key).toHaveLength(32);
        expect(message).toEqual('lorem ipsum');
        return { encrypted: 'encrypted', authTag: 'lorem' };
      });
      const result = await subject.encrypt('lorem ipsum');
      expect(result).toEqual({
        id: generatedId.toString(),
        secret: generatedKey.toString('hex'),
      });
      expect(messagesRepository.create).toBeCalledWith(expect.objectContaining({
        id: generatedId.toString(),
        encrypted: 'encrypted',
        authTag: 'lorem',
        expireAt: expect.any(Date),
      }));
    });
  });

  describe('#decrypt', () => {
    it('returns the decrypted version of a message', async () => {
      messagesRepository.find.mockImplementation((id) => {
        expect(id).toEqual('1234');
        return Promise.resolve({ encrypted: 'encrypted', authTag: 'lorem' });
      });
      encryptor.decrypt.mockImplementation(({ key, iv, encrypted, authTag }) => {
        expect(key.toString()).toEqual('secret');
        expect(iv.toString()).toEqual('1234');
        expect(encrypted).toEqual('encrypted');
        expect(authTag).toEqual('lorem');
        return 'decrypted';
      });
      expect(await subject.decrypt({
        id: '1234',
        secret: '736563726574',
      })).toEqual('decrypted');
    });

    it('enqueues a message decrypted event', async () => {
      encryptor.decrypt.mockReturnValue('decrypted');
      await subject.decrypt({
        id: '1234',
        secret: '736563726574',
      });
      expect(eventsService.sendMessageDecrypted).toHaveBeenCalledWith('1234');
    });

    it('ignores errors triggered by event publishing', async () => {
      encryptor.decrypt.mockReturnValue('decrypted');
      eventsService.sendMessageDecrypted.mockRejectedValue(new Error('asd'));
      expect(await subject.decrypt({
        id: '1234',
        secret: '736563726574',
      })).toEqual('decrypted');
    });
  });
});
