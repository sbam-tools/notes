import 'reflect-metadata';
import { container, Lifecycle } from "tsyringe";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { APIGatewayAdapter } from "./encryptor/api-gateway-adapter";
import { IEncryptLogic, IEncryptor } from './encryptor/interfaces';
import { AESEncryptor } from './encryptor/aes-encryptor';
import { EncryptLogic } from './encryptor/encrypt-logic';
import { IMessagesRepository } from './repositories/interfaces';
import { DDBMessagesRepository } from './repositories/ddb-messages-repository';
import { Logger } from '@aws-lambda-powertools/logger';

container.register<IEncryptor>('IEncryptor', { useClass: AESEncryptor }, { lifecycle: Lifecycle.Singleton });
container.register<IEncryptLogic>('IEncryptLogic', { useClass: EncryptLogic }, { lifecycle: Lifecycle.Singleton });
container.register<IMessagesRepository>('IMessagesRepository', { useClass: DDBMessagesRepository }, { lifecycle: Lifecycle.Singleton });
container.register(Logger, { useValue: new Logger() });

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return container.resolve(APIGatewayAdapter).execute(event);
}
