import { inject, registry, singleton } from 'tsyringe';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { MessageNotFoundError } from '../encryptor/errors';
import { CreateMessageInput, IMessagesRepository, MessageDocument } from './interfaces';

@singleton()
@registry([
  { token: 'DDB_CLIENT', useValue: DynamoDBDocumentClient.from(new DynamoDBClient({})) },
  { token: 'DDB_TABLE', useValue: process.env.TABLE_NAME! },
])
export class DDBMessagesRepository implements IMessagesRepository {
  constructor(
    @inject('DDB_CLIENT') private readonly client: DynamoDBDocumentClient,
    @inject('DDB_TABLE') private readonly tableName: string,
  ) {}

  async create(message: CreateMessageInput): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          id: message.id,
          encrypted: message.encrypted,
          authTag: message.authTag,
          _ct: new Date().toISOString(),
          TTL: message.expireAt ? Math.round(message.expireAt.getTime() / 1000) : null,
        },
      }),
    );
  }

  async find(id: string): Promise<MessageDocument> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          id,
        },
      }),
    );
    if (!result.Item) {
      throw new MessageNotFoundError(id);
    }
    const { encrypted, authTag } = result.Item!;
    return { encrypted, authTag };
  }

  async delete(ids: string[]): Promise<void> {
    await this.client.send(
      new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: ids.map((id) => ({
            DeleteRequest: {
              Key: {
                id,
              },
            },
          })),
        },
      }),
    );
  }
}
