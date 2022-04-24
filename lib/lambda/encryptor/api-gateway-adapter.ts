import { inject, registry, singleton } from 'tsyringe';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AESEncryptor } from './aes-encryptor';
import { EncryptLogic } from './encrypt-logic';
import { DDBMessagesRepository } from '../repositories/ddb-messages-repository';
import { DecryptError, MessageNotFoundError } from './errors';
import { withCors } from '../middlewares';
import { IEncryptLogic } from './interfaces';

@singleton()
@registry([
  { token: 'IEncryptor', useClass: AESEncryptor },
  { token: 'IEncryptLogic', useClass: EncryptLogic },
  { token: 'IMessagesRepository', useClass: DDBMessagesRepository },
])
export class APIGatewayAdapter {
  constructor(
    @inject('IEncryptLogic') private readonly logic: IEncryptLogic
  ) {}

  async execute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return withCors(async () => {
      try {
        if (event.path.startsWith('/encrypt')) {
          return this.encrypt(event);
        } else if (event.path.startsWith('/decrypt')) {
          return this.decrypt(event);
        } else {
          console.error('Unsupported operation', { path: event.path });
          return {
            statusCode: 400,
            body: JSON.stringify('Unsupported operation'),
          };
        }
      } catch (e) {
        console.error(e);
        return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal error' }),
        };
      }
    });
  }

  private async encrypt(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const body = event.isBase64Encoded ? Buffer.from(event.body!, 'base64').toString('utf8') : event.body!;
    const message = JSON.parse(body).message!;
    const response = await this.logic.encrypt(message);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  }

  private async decrypt(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      const id = event.pathParameters!.id!;
      const body = event.isBase64Encoded ? Buffer.from(event.body!, 'base64').toString('utf8') : event.body!;
      const secret = JSON.parse(body).secret;
      const decrypted = await this.logic.decrypt({ id, secret });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: decrypted }),
      };
    } catch (e) {
      if (e instanceof MessageNotFoundError || e instanceof DecryptError) {
        console.error(e);
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Message not found or invalid secret' }),
        };
      }
      throw e;
    }
  }
}
