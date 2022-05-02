import { container } from 'tsyringe';
import { AESEncryptor } from './aes-encryptor';
import { DecryptError } from './errors';

describe('lambda/encryptor/AESEncryptor', () => {
  let subject: AESEncryptor;

  beforeEach(() => {
    container.reset();
    subject = container.resolve(AESEncryptor);
  });

  describe('#encrypt', () => {
    it('returns the encrypted version of a message', () => {
      const req = {
        key: Buffer.from('c10aeff4f126f80f9c827e7c3c99361560ea8596c74553802b75c0686991f49d', 'hex'),
        iv: Buffer.from('lorem ipsum'),
        message: 'lorem ipsum',
      };
      expect(subject.encrypt(req)).toEqual({
        encrypted: 'b12352b66d9bd9c69f0fe6',
        authTag: '2f5a41588afc055f2f16325640729a21',
      });
    });
  });

  describe('#decrypt', () => {
    it('returns the decrypted version of a message', () => {
      const req = {
        key: Buffer.from('c10aeff4f126f80f9c827e7c3c99361560ea8596c74553802b75c0686991f49d', 'hex'),
        iv: Buffer.from('lorem ipsum'),
        encrypted: 'b12352b66d9bd9c69f0fe6',
        authTag: '2f5a41588afc055f2f16325640729a21',
      };
      expect(subject.decrypt(req)).toEqual('lorem ipsum');
    });

    it('raises error if message cannot be decrypted', () => {
      const req = {
        key: Buffer.from('c11beff4f126f80f9c827e7c3c99361560ea8596c74553802b75c0686991f49d', 'hex'),
        iv: Buffer.from('lorem ipsum'),
        encrypted: 'b12352b66d9bd9c69f0fe6',
        authTag: '2f5a41588afc055f2f16325640729a21',
      };
      expect(() => {
        subject.decrypt(req);
      }).toThrowError(DecryptError);
    });
  });
});
