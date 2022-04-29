import 'jest-dynalite/withDb';
import { APIGatewayProxyEvent } from "aws-lambda";
import { container } from "tsyringe";
import { APIGatewayAdapter } from "./api-gateway-adapter";
import { IEncryptLogic } from './interfaces';
import { MessageNotFoundError, DecryptError } from './errors';

describe('lambda/encryptor/APIGatewayAdapter', () => {
  const encryptLogic = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  }
  let subject: APIGatewayAdapter;

  beforeEach(() => {
    container.register<IEncryptLogic>('IEncryptLogic', { useValue: encryptLogic });
    subject = container.resolve(APIGatewayAdapter);
  });

  describe('encryption', () => {
    it('works with a base64 body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await subject.execute({
        path: '/encrypt',
        body: Buffer.from(JSON.stringify({
          message: 'lorem ipsum'
        }), 'utf8').toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEvent);
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('works with a string body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await subject.execute({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
      } as unknown as APIGatewayProxyEvent);
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns the encryption response', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await subject.execute({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
      } as unknown as APIGatewayProxyEvent);
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns a 500 error if encryption fails', async () => {
      encryptLogic.encrypt.mockRejectedValue(new Error('error'));
      const encryptResponse = await subject.execute({
        path: '/encrypt',
        body: JSON.stringify({
          message: 'lorem ipsum'
        }),
      } as unknown as APIGatewayProxyEvent);
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'Internal error' }));
    });
  });

  describe('decryption', () => {
    it('works with a base64 body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await subject.execute({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: Buffer.from(JSON.stringify({
          secret: 'secret',
        }), 'utf8').toString('base64'),
        isBase64Encoded: true,
      } as unknown as APIGatewayProxyEvent);
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('works with a string body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await subject.execute({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        })
      } as unknown as APIGatewayProxyEvent);
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('returns a 404 if encryption logic raises a MessageNotFoundError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new MessageNotFoundError('1234'));
      const encryptResponse = await subject.execute({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        })
      } as unknown as APIGatewayProxyEvent);
      expect(encryptResponse.statusCode).toEqual(404);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'Message not found or invalid secret' }));
    });

    it('returns a 404 if encryption logic raises a DecryptError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new DecryptError());
      const encryptResponse = await subject.execute({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        })
      } as unknown as APIGatewayProxyEvent);
      expect(encryptResponse.statusCode).toEqual(404);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'Message not found or invalid secret' }));
    });

    it('returns a 500 error if decryption fails for unknown reasons', async () => {
      encryptLogic.decrypt.mockRejectedValue(new Error());
      const encryptResponse = await subject.execute({
        path: '/decrypt/1234',
        pathParameters: { id: '1234' },
        body: JSON.stringify({
          secret: 'secret',
        })
      } as unknown as APIGatewayProxyEvent);
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'Internal error' }));
    });
  });
});
