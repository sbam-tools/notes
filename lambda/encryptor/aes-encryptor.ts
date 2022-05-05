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
import { singleton } from 'tsyringe';
import * as crypto from 'crypto';
import { DecryptError } from './errors';
import { DecryptParams, EncryptParams, EncryptResult, IEncryptor } from './interfaces';

@singleton()
export class AESEncryptor implements IEncryptor {
  encrypt({ key, iv, message }: EncryptParams): EncryptResult {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = cipher.update(message, 'utf8', 'hex');
    return {
      encrypted: encrypted + cipher.final('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
    };
  }

  decrypt({ key, iv, encrypted, authTag }: DecryptParams): string {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      const decrypted = decipher.update(encrypted, 'hex', 'utf8');
      return decrypted + decipher.final('utf8');
    } catch (e) {
      if ((e as Error).message === 'Unsupported state or unable to authenticate data') {
        throw new DecryptError();
      }
      throw e;
    }
  }
}
