import { container } from 'tsyringe';
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { MessageNotFoundError } from '../encryptor/errors';
import { DDBMessagesRepository } from './ddb-messages-repository';

describe('lambda/encryptor/DDBMessagesRepository', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient);
  let subject: DDBMessagesRepository;

  beforeEach(() => {
    ddbMock.reset();
    container.clearInstances();
    container.register('DDB_TABLE', { useValue: 'table' });
    container.register('DDB_CLIENT', { useValue: ddbMock });
    subject = container.resolve(DDBMessagesRepository);
  });

  describe('#create', () => {
    it('writes on DDB', async () => {
      await subject.create({
        id: '1234',
        encrypted: 'foobar',
        authTag: 'lorem',
        expireAt: new Date(2022, 1, 1),
      });
      expect(ddbMock.calls()).toHaveLength(1);
      expect(
        ddbMock.commandCalls(PutCommand, {
          TableName: 'table',
          Item: {
            encrypted: 'foobar',
            authTag: 'lorem',
            id: '1234',
            TTL: 1643670000,
          },
        }),
      ).toHaveLength(1);
    });
  });

  describe('#find', () => {
    it('throws an error if message cannot be found', async () => {
      ddbMock.on(GetCommand).resolves({});
      await expect(subject.find('1234')).rejects.toThrowError(MessageNotFoundError);
    });

    it('returns the encrypted string if message deletion succeeds', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: `m#1234`,
          encrypted: 'foobar',
          authTag: 'lorem',
          id: '1234',
          _et: 'message',
        },
      });
      expect(await subject.find('1234')).toEqual({
        encrypted: 'foobar',
        authTag: 'lorem',
      });
    });
  });

  describe('#delete', () => {
    it('works', async () => {
      ddbMock.onAnyCommand().rejects();
      ddbMock.on(BatchWriteCommand, {
        RequestItems: {
          table: [{ DeleteRequest: { Key: { id: '1' } } }, { DeleteRequest: { Key: { id: '2' } } }],
        },
      });
      await subject.delete(['1', '2']);
    });
  });
});
