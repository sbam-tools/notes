import { inject, singleton } from 'tsyringe';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DecryptError, MessageNotFoundError } from './errors';
import { withCors } from '../middlewares';
import { IEncryptLogic } from './interfaces';
import { Logger } from '@aws-lambda-powertools/logger';

@singleton()
export class APIGatewayAdapter {
  constructor(
    @inject('IEncryptLogic') private readonly logic: IEncryptLogic,
    @inject(Logger) private readonly logger: Logger,
  ) {}

  async execute(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return withCors(async () => {
      try {
        if (event.path.startsWith('/encrypt')) {
          return await this.encrypt(event);
        } else if (event.path.startsWith('/decrypt')) {
          return await this.decrypt(event);
        } else {
          this.logger.error('Unsupported operation', { path: event.path });
          return {
            statusCode: 400,
            body: JSON.stringify('Unsupported operation'),
          };
        }
      } catch (e) {
        this.logger.error('Internal error', e as Error);
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
        this.logger.error('Decryption error', e);
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Message not found or invalid secret' }),
        };
      }
      throw e;
    }
  }
}
