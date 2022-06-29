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
import 'reflect-metadata';
import { container, inject, Lifecycle, registry, singleton } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import createError from 'http-errors';
import checkExistenceInputSchema from '../../schemas/encryptor/check-existence.input.schema.json';
import decryptInputSchema from '../../schemas/encryptor/decrypt.input.schema.json';
import encryptInputSchema from '../../schemas/encryptor/encrypt.input.schema.json';
import { DDBMessagesRepository } from '../repositories/ddb-messages-repository';
import { AESEncryptor } from './aes-encryptor';
import { EncryptLogic } from './encrypt-logic';
import { DecryptError, MessageNotFoundError } from './errors';
import { IEncryptLogic } from './interfaces';
import middify from './middify';

interface EncryptRequestBody {
  message: string;
}

interface DecryptRequestBody {
  secret: string;
}

@singleton()
@registry([
  { token: 'IEncryptor', useClass: AESEncryptor, options: { lifecycle: Lifecycle.Singleton } },
  { token: 'IEncryptLogic', useClass: EncryptLogic, options: { lifecycle: Lifecycle.Singleton } },
  { token: 'IMessagesRepository', useClass: DDBMessagesRepository, options: { lifecycle: Lifecycle.Singleton } },
  { token: Logger, useValue: new Logger() },
])
class RestAPIHandlers {
  constructor(@inject('IEncryptLogic') private readonly encryptLogic: IEncryptLogic) {}

  async encrypt(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { message } = event.body as unknown as EncryptRequestBody;
    const response = await this.encryptLogic.encrypt(message);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  async decrypt(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters!.id!;
      const { secret } = event.body as unknown as DecryptRequestBody;
      const message = await this.encryptLogic.decrypt({ id, secret });
      return {
        statusCode: 200,
        body: JSON.stringify({ message }),
      };
    } catch (e) {
      if (e instanceof MessageNotFoundError) {
        throw createError(404, 'Message not found');
      } else if (e instanceof DecryptError) {
        throw createError(422, 'Invalid secret');
      }
      throw e;
    }
  }

  async detect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const id = event.pathParameters!.id!;
    const exists = await this.encryptLogic.detect(id);
    if (!exists) {
      throw createError(404, 'Message not found');
    }
    return {
      statusCode: 200,
      body: '',
    };
  }
}

export const encryptHandler = middify(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return container.resolve(RestAPIHandlers).encrypt(event);
}, encryptInputSchema);

export const decryptHandler = middify(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return container.resolve(RestAPIHandlers).decrypt(event);
}, decryptInputSchema);

export const checkExistenceHandler = middify(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return container.resolve(RestAPIHandlers).detect(event);
}, checkExistenceInputSchema);
