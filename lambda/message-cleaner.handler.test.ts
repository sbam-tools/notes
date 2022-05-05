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
import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import 'jest-dynalite/withDb';
import { buildLocalDDBClient } from '../test/helpers';
import { SQSAdapter } from './message-cleaner.handler';

describe('[integration] lambda/MessageCleanerHandler', () => {
  const ddbClient = buildLocalDDBClient();
  let subject: SQSAdapter;

  beforeEach(() => {
    container.register('DDB_CLIENT', { useValue: ddbClient });
    container.register('DDB_TABLE', { useValue: 'table' });
    subject = container.resolve(SQSAdapter);
  });

  afterAll(() => {
    ddbClient.destroy();
  });

  it('works as expected', async () => {
    await ddbClient.send(
      new BatchWriteCommand({
        RequestItems: {
          table: [
            {
              PutRequest: {
                Item: {
                  id: '1',
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  id: '2',
                },
              },
            },
          ],
        },
      }),
    );
    await subject.handle({
      Records: [
        {
          body: JSON.stringify({
            detail: {
              id: '1',
            },
          }),
        },
        {
          body: JSON.stringify({
            detail: {
              id: '2',
            },
          }),
        },
      ],
    } as SQSEvent);
    const items = await ddbClient.send(
      new ScanCommand({
        TableName: 'table',
      }),
    );
    expect(items.Count).toEqual(0);
  });
});
