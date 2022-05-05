// Copyright (C) 2022 Nicola Racco
//
// SBAM Notes is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// SBAM Notes is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with SBAM Notes. If not, see <http://www.gnu.org/licenses/>.
import { container } from 'tsyringe';
import { EventBridgeService } from '../services/events-service';
import { EncryptLogic } from './encrypt-logic';

describe('lambda/encryptor/EncryptLogic', () => {
  const eventsService = {
    sendMessageDecrypted: jest.fn(),
    sendMessageEncrypted: jest.fn(),
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
      expect(messagesRepository.create).toBeCalledWith(
        expect.objectContaining({
          id: generatedId.toString(),
          encrypted: 'encrypted',
          authTag: 'lorem',
          expireAt: expect.any(Date),
        }),
      );
    });

    it('enqueues a message encrypted event', async () => {
      let generatedId = Buffer.from('');
      encryptor.encrypt.mockImplementation(({ iv }) => {
        generatedId = iv;
        return { encrypted: 'encrypted', authTag: 'lorem' };
      });
      await subject.encrypt('lorem');
      expect(eventsService.sendMessageEncrypted).toHaveBeenCalledWith(generatedId.toString());
    });

    it('ignores errors triggered by event publishing', async () => {
      eventsService.sendMessageEncrypted.mockRejectedValue(new Error('asd'));
      await subject.encrypt('lorem');
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
      expect(
        await subject.decrypt({
          id: '1234',
          secret: '736563726574',
        }),
      ).toEqual('decrypted');
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
      expect(
        await subject.decrypt({
          id: '1234',
          secret: '736563726574',
        }),
      ).toEqual('decrypted');
    });
  });
});
