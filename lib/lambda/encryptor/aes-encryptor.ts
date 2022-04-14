import * as crypto from 'crypto';
import { singleton } from 'tsyringe';
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
