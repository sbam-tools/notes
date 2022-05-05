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
import { inject, Lifecycle, registry, singleton } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { IMessagesRepository } from '../repositories/interfaces';
import { EventBridgeService } from '../services/events-service';
import { DecryptRequest, IEncryptLogic, IEncryptor } from './interfaces';

export interface EncryptResponse {
  id: string;
  secret: string;
}

@registry([{ token: Logger, useClass: Logger, options: { lifecycle: Lifecycle.Singleton } }])
@singleton()
export class EncryptLogic implements IEncryptLogic {
  constructor(
    @inject('IEncryptor') private readonly encryptor: IEncryptor,
    @inject('IMessagesRepository') private readonly repository: IMessagesRepository,
    @inject(EventBridgeService) private readonly eventsService: EventBridgeService,
    @inject(Logger) private readonly logger: Logger,
  ) {}

  async encrypt(message: string): Promise<EncryptResponse> {
    const id = nanoid();
    const key = crypto.randomBytes(32);
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7);
    const result = this.encryptor.encrypt({
      key,
      iv: Buffer.from(id),
      message: message,
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
      ...message,
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
