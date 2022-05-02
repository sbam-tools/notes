import { container } from 'tsyringe';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import 'jest-dynalite/withDb';
import { buildLocalDDBClient } from '../test/helpers';
import { encryptHandler, decryptHandler } from './encryptor/rest-api.handlers';

describe('[integration] lambda/encryptor', () => {
  const ddbClient = buildLocalDDBClient();
  const eventBridgeClient = mockClient(EventBridgeClient);

  beforeEach(() => {
    container.register('DDB_CLIENT', { useValue: ddbClient });
    container.register('DDB_TABLE', { useValue: 'table' });
    container.register('EVENT_BRIDGE_CLIENT', { useValue: eventBridgeClient });
    container.register('EVENT_BUS_NAME', { useValue: '' });
  });

  afterAll(() => {
    ddbClient.destroy();
  });

  it('works as expected', async () => {
    const encryptResponse = await encryptHandler(
      {
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        httpMethod: 'POST',
      } as unknown as APIGatewayProxyEvent,
      {} as Context,
    );
    const { id, secret } = JSON.parse(encryptResponse.body);
    const decryptResponse = await decryptHandler(
      {
        path: '/decrypt/:id',
        pathParameters: {
          id,
        },
        body: JSON.stringify({
          secret,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        httpMethod: 'POST',
      } as unknown as APIGatewayProxyEvent,
      {} as Context,
    );
    const { message } = await JSON.parse(decryptResponse.body);
    expect(message).toEqual('lorem ipsum');
  });

  it('returns cors headers', async () => {
    const encryptResponse = await encryptHandler(
      {
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum',
        }),
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://notes.sbam.dev',
        },
        httpMethod: 'POST',
      } as unknown as APIGatewayProxyEvent,
      {} as Context,
    );
    expect(encryptResponse.statusCode).toEqual(200);
    expect(encryptResponse.headers!['Access-Control-Allow-Origin']).toEqual('*');
  });

  it('returns cors headers for errors too', async () => {
    const encryptResponse = await encryptHandler(
      {
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum',
        }),
        headers: {
          'Content-Type': 'text/plain',
          Origin: 'https://notes.sbam.dev',
        },
        httpMethod: 'POST',
      } as unknown as APIGatewayProxyEvent,
      {} as Context,
    );
    expect(encryptResponse.statusCode).toEqual(400);
    expect(encryptResponse.headers!['Access-Control-Allow-Origin']).toEqual('*');
  });
});
