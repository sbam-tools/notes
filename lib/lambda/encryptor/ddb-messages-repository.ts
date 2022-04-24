import { DynamoDBDocumentClient, PutCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { inject, singleton } from 'tsyringe';
import { MessageNotFoundError } from "./errors";
import { IMessagesRepository, CreateMessageInput, MessageDocument } from './interfaces';
import { DDB_CLIENT, DDB_TABLE_NAME } from './types';

@singleton()
export class DDBMessagesRepository implements IMessagesRepository {
  constructor(
    @inject(DDB_CLIENT) private readonly client: DynamoDBDocumentClient,
    @inject(DDB_TABLE_NAME) private readonly tableName: string,
  ) {}

  async create(message: CreateMessageInput): Promise<void> {
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        id: message.id,
        encrypted: message.encrypted,
        authTag: message.authTag,
        _ct: new Date().toISOString(),
        TTL: message.expireAt ? Math.round(message.expireAt.getTime() / 1000) : null,
      },
    }));
  }

  async find(id: string): Promise<MessageDocument> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        id,
      },
    }));
    if (!result.Item) {
      throw new MessageNotFoundError(id);
    }
    const { encrypted, authTag } = result.Item!;
    return { encrypted, authTag };
  }
}
