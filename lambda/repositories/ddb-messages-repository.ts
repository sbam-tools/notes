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

  async exists(id: string): Promise<boolean> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          id,
        },
        ProjectionExpression: 'id',
      }),
    );
    return !!result.Item;
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
