import 'jest-dynalite/withDb';
import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";
import { container } from "tsyringe";
import { buildLocalDDBClient } from "../../test/helpers";
import { SQSAdapter } from "./message-cleaner.handler";

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
    await ddbClient.send(new BatchWriteCommand({
      RequestItems: {
        table: [{
          PutRequest: {
            Item: {
              id: '1',
            },
          },
        }, {
          PutRequest: {
            Item: {
              id: '2',
            },
          },
        }],
      },
    }));
    await subject.handle({
      Records: [
        {
          body: JSON.stringify({
            detail: {
              id: '1',
            }
          }),
        },
        {
          body: JSON.stringify({
            detail: {
              id: '2',
            }
          }),
        },
      ],
    } as SQSEvent);
    const items = await ddbClient.send(new ScanCommand({
      TableName: 'table',
    }));
    expect(items.Count).toEqual(0);
  });
});
