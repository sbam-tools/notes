import 'jest-dynalite/withDb';
import { APIGatewayProxyEvent } from "aws-lambda";
import { container } from "tsyringe";
import { APIGatewayAdapter } from "./api-gateway-adapter";
import { mockClient } from "aws-sdk-client-mock";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { buildLocalDDBClient } from "../../test/helpers";

describe('[integration] lambda/encryptor/APIGatewayAdapter', () => {
  const ddbClient = buildLocalDDBClient();
  const eventBridgeClient = mockClient(EventBridgeClient);
  let subject: APIGatewayAdapter;

  beforeEach(() => {
    container.register('DDB_CLIENT', { useValue: ddbClient });
    container.register('DDB_TABLE', { useValue: 'table' });
    container.register('EVENT_BRIDGE_CLIENT', { useValue: eventBridgeClient });
    container.register('EVENT_BUS_NAME', { useValue: '' });
    subject = container.resolve(APIGatewayAdapter);
  });

  afterAll(() => {
    ddbClient.destroy();
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
