import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { inject, singleton } from 'tsyringe';
import { IMessagesRepository } from '../repositories/interfaces';
import { EventBridgeService } from '../services/events-service';
import { DecryptRequest, IEncryptLogic, IEncryptor } from './interfaces';
import { SingletonLogger } from '../singleton-logger';

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
    @inject(SingletonLogger) private readonly logger: SingletonLogger,
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
    this.logger.info('Encrypted message', { id });
    try {
      await this.eventsService.sendMessageEncrypted(id);
    } catch (e) {
      this.logger.warn('Cannot publish encrypt event', e as Error);
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
    this.logger.info('Decrypted message', { id });
    try {
      await this.eventsService.sendMessageDecrypted(id);
    } catch (e) {
      this.logger.warn('Cannot publish decrypt event', e as Error);
    }
    return decrypted;
  }
}
