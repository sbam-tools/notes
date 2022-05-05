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
