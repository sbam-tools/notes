import { APIGatewayProxyEvent } from "aws-lambda";
import { container } from "tsyringe";
import { APIGatewayAdapter } from "./api-gateway-adapter";
import { DDB_CLIENT, DDB_TABLE_NAME } from "./types";
import 'jest-dynalite/withDb';
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe('[integration] lambda/encryptor/APIGatewayAdapter', () => {
  const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    region: 'local',
  }));
  let subject: APIGatewayAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    container.register(DDB_CLIENT, { useValue: ddbClient });
    container.register(DDB_TABLE_NAME, { useValue: 'table' });
    subject = container.resolve(APIGatewayAdapter);
  });

  it('works as expected', async () => {
    const encryptResponse = await subject.execute({
      path: '/encrypt',
      body: JSON.stringify({
        message: 'lorem ipsum'
      }),
    } as unknown as APIGatewayProxyEvent);
    const { id, secret } = JSON.parse(encryptResponse.body);
    const decryptResponse = await subject.execute({
      path: '/decrypt/:id',
      pathParameters: {
        id,
      },
      body: JSON.stringify({
        secret,
      }),
    } as unknown as APIGatewayProxyEvent);
    const { message } = await JSON.parse(decryptResponse.body);
    expect(message).toEqual('lorem ipsum');
    const persisted = await ddbClient.send(new GetCommand({
      TableName: 'table',
      Key: {
        id,
      },
    }));
    expect(persisted.Item).toBeUndefined();
  });

  it('can properly work with base64 input', async () => {
    const encryptResponse = await subject.execute({
      path: '/encrypt',
      body: Buffer.from(JSON.stringify({
        message: 'lorem ipsum'
      }), 'utf8').toString('base64'),
      isBase64Encoded: true,
    } as unknown as APIGatewayProxyEvent);
    const { id, secret } = JSON.parse(encryptResponse.body);
    const decryptResponse = await subject.execute({
      path: '/decrypt/:id',
      pathParameters: {
        id,
      },
      body: JSON.stringify({
        secret,
      }),
    } as unknown as APIGatewayProxyEvent);
    const { message } = await JSON.parse(decryptResponse.body);
    expect(message).toEqual('lorem ipsum');
  });
});
