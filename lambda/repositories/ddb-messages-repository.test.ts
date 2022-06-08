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

  describe('#exists', () => {
    it('returns false if message cannot be found', async () => {
      ddbMock.on(GetCommand).resolves({});
      expect(await subject.exists('1234')).toEqual(false);
    });

    it('returns true if message is found', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: `m#1234`,
          encrypted: 'foobar',
          authTag: 'lorem',
          id: '1234',
          _et: 'message',
        },
      });
      expect(await subject.exists('1234')).toEqual(true);
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
