import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { inject, singleton } from 'tsyringe';
import { DecryptRequest, IEncryptLogic, IEncryptor, IMessagesRepository } from './interfaces';
import { ENCRYPTOR, MESSAGES_REPOSITORY } from './types';

export interface EncryptResponse {
  id: string;
  secret: string;
}

@singleton()
export class EncryptLogic implements IEncryptLogic {
  constructor(
    @inject(ENCRYPTOR) private readonly encryptor: IEncryptor,
    @inject(MESSAGES_REPOSITORY) private readonly repository: IMessagesRepository,
  ) {}

  async encrypt(message: string): Promise<EncryptResponse> {
    const id = nanoid();
    const key = crypto.randomBytes(32);
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7);
    const result = this.encryptor.encrypt({
      key,
      iv: Buffer.from(id),
      message: message
    });
    await this.repository.create({
      id,
      expireAt,
      ...result,
    });
    return { id, secret: key.toString('hex') };
  }

  async decrypt({ id, secret }: DecryptRequest): Promise<string | undefined> {
    const message = await this.repository.find(id);
    return this.encryptor.decrypt({
      key: Buffer.from(secret, 'hex'),
      iv: Buffer.from(id),
      ...message
    });
  }
}
