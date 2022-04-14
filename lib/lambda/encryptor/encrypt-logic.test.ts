import { container } from "tsyringe";
import { EncryptLogic } from "./encrypt-logic";
import { ENCRYPTOR, MESSAGES_REPOSITORY } from "./types";

describe('lambda/encryptor/EncryptLogic', () => {
  const encryptorEncryptMock = jest.fn();
  const encryptorDecryptMock = jest.fn();
  const repositoryCreateMock = jest.fn();
  const repositoryFindMock = jest.fn();
  let subject: EncryptLogic;

  beforeEach(() => {
    container.reset();
    jest.clearAllMocks();
    container.register(ENCRYPTOR, {
      useValue: {
        encrypt: encryptorEncryptMock,
        decrypt: encryptorDecryptMock,
      },
    });
    container.register(MESSAGES_REPOSITORY, {
      useValue: {
        create: repositoryCreateMock,
        find: repositoryFindMock,
      },
    });
    subject = container.resolve(EncryptLogic);
  });

  describe('#encrypt', () => {
    it('creates a message with a generated id and the encrypted version of a message', async () => {
      let generatedId = Buffer.from('');
      let generatedKey = Buffer.from('');
      encryptorEncryptMock.mockImplementation(({ key, iv, message }) => {
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
      expect(repositoryCreateMock).toBeCalledWith(expect.objectContaining({
        id: generatedId.toString(),
        encrypted: 'encrypted',
        authTag: 'lorem',
        expireAt: expect.any(Date),
      }));
    });
  });

  describe('#decrypt', () => {
    it('returns the decrypted version of a message', async () => {
      repositoryFindMock.mockImplementation((id) => {
        expect(id).toEqual('1234');
        return Promise.resolve({ encrypted: 'encrypted', authTag: 'lorem' });
      });
      encryptorDecryptMock.mockImplementation(({ key, iv, encrypted, authTag }) => {
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
  });
});
