import 'reflect-metadata';
import { container, inject, Lifecycle, registry, singleton } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import createError from 'http-errors';
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
      if (e instanceof MessageNotFoundError || e instanceof DecryptError) {
        throw createError(404, 'Message not found or invalid secret');
      }
      throw e;
    }
  }
}

export const encryptHandler = middify(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return container.resolve(RestAPIHandlers).encrypt(event);
}, encryptInputSchema);

export const decryptHandler = middify(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return container.resolve(RestAPIHandlers).decrypt(event);
}, decryptInputSchema);
