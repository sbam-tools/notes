import 'jest-dynalite/withDb';
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { container } from "tsyringe";
import { MessageNotFoundError, DecryptError } from './errors';
import { encryptHandler, decryptHandler } from './rest-api.handlers';
import { IEncryptLogic } from './interfaces';

describe('lambda/encryptor/rest-api.handlers', () => {
  const encryptLogic = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  }

  beforeEach(() => {
    container.register<IEncryptLogic>('IEncryptLogic', { useValue: encryptLogic });
  });

  describe('/decryptHandler', () => {
    it('works with a base64 body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await decryptHandler({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: Buffer.from(JSON.stringify({
          secret: 'secret',
        }), 'utf8').toString('base64'),
        isBase64Encoded: true,
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('works with a string body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await decryptHandler({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('returns a 404 if encryption logic raises a MessageNotFoundError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new MessageNotFoundError('1234'));
      const encryptResponse = await decryptHandler({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(404);
      expect(encryptResponse.body).toEqual('Message not found or invalid secret');
    });

    it('returns a 404 if encryption logic raises a DecryptError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new DecryptError());
      const encryptResponse = await decryptHandler({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(404);
      expect(encryptResponse.body).toEqual('Message not found or invalid secret');
    });

    it('returns a 500 error if decryption fails for unknown reasons', async () => {
      encryptLogic.decrypt.mockRejectedValue(new Error());
      const encryptResponse = await decryptHandler({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual('Internal error');
    });
  });

  describe('/encryptHandler', () => {
    it('works with a base64 body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: Buffer.from(JSON.stringify({
          message: 'lorem ipsum'
        }), 'utf8').toString('base64'),
        isBase64Encoded: true,
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('works with a string body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns the encryption response', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns an error if content-type is not set to json', async () => {
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
        headers: {
          'Content-Type': 'plain/text',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(400);
      expect(encryptResponse.body).toEqual('Validation error: /headers/content-type must be equal to one of the allowed values');
    });

    it('returns an error if request body is malformed', async () => {
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: JSON.stringify({
          errored_field: 'lorem ipsum'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(400);
      expect(encryptResponse.body).toEqual('Validation error: /body must have required property message');
    });

    it('returns a 500 error if encryption fails', async () => {
      encryptLogic.encrypt.mockRejectedValue(new Error('error'));
      const encryptResponse = await encryptHandler({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      } as unknown as APIGatewayProxyEvent,
      {} as Context);
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual('Internal error');
    });
  });
});