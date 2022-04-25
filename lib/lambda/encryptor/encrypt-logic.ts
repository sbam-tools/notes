import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { inject, singleton } from 'tsyringe';
import { IMessagesRepository } from '../repositories/interfaces';
import { EventBridgeService } from '../services/events-service';
import { DecryptRequest, IEncryptLogic, IEncryptor } from './interfaces';

export interface EncryptResponse {
  id: string;
  secret: string;
}

@singleton()
export class EncryptLogic implements IEncryptLogic {
  constructor(
    @inject('IEncryptor') private readonly encryptor: IEncryptor,
    @inject('IMessagesRepository') private readonly repository: IMessagesRepository,
    @inject(EventBridgeService) private readonly eventsService: EventBridgeService,
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
    try {
      await this.eventsService.sendMessageEncrypted(id);
    } catch (e) {
      console.warn('Cannot publish encrypt event', e);
    }
    return { id, secret: key.toString('hex') };
  }

  async decrypt({ id, secret }: DecryptRequest): Promise<string> {
    const message = await this.repository.find(id);
    const decrypted = await this.encryptor.decrypt({
      key: Buffer.from(secret, 'hex'),
      iv: Buffer.from(id),
      ...message
    });
    try {
      await this.eventsService.sendMessageDecrypted(id);
    } catch (e) {
      console.warn('Cannot publish decrypt event', e);
    }
    return decrypted;
  }
}
