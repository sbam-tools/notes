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
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import 'jest-dynalite/withDb';
import { MessageNotFoundError, DecryptError } from './errors';
import { IEncryptLogic } from './interfaces';
import { encryptHandler, decryptHandler } from './rest-api.handlers';

describe('lambda/encryptor/rest-api.handlers', () => {
  const encryptLogic = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(() => {
    container.register<IEncryptLogic>('IEncryptLogic', { useValue: encryptLogic });
  });

  describe('/decryptHandler', () => {
    it('works with a base64 body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await decryptHandler(
        {
          path: '/decrypt/1234',
          pathParameters: { id: '1234' },
          body: Buffer.from(
            JSON.stringify({
              secret: 'secret',
            }),
            'utf8',
          ).toString('base64'),
          isBase64Encoded: true,
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('works with a string body', async () => {
      encryptLogic.decrypt.mockResolvedValue('lorem ipsum');
      const encryptResponse = await decryptHandler(
        {
          path: '/decrypt/1234',
          pathParameters: { id: '1234' },
          body: JSON.stringify({
            secret: 'secret',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptLogic.decrypt).toHaveBeenCalledWith({ id: '1234', secret: 'secret' });
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ message: 'lorem ipsum' }));
    });

    it('returns a 404 if encryption logic raises a MessageNotFoundError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new MessageNotFoundError('1234'));
      const encryptResponse = await decryptHandler(
        {
          path: '/decrypt/1234',
          pathParameters: { id: '1234' },
          body: JSON.stringify({
            secret: 'secret',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(404);
      expect(JSON.parse(encryptResponse.body).reason).toEqual('Message not found or invalid secret');
    });

    it('returns a 404 if encryption logic raises a DecryptError', async () => {
      encryptLogic.decrypt.mockRejectedValue(new DecryptError());
      const encryptResponse = await decryptHandler(
        {
          path: '/decrypt/1234',
          pathParameters: { id: '1234' },
          body: JSON.stringify({
            secret: 'secret',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(404);
      expect(JSON.parse(encryptResponse.body).reason).toEqual('Message not found or invalid secret');
    });

    it('returns a 500 error if decryption fails for unknown reasons', async () => {
      encryptLogic.decrypt.mockRejectedValue(new Error());
      const encryptResponse = await decryptHandler(
        {
          path: '/decrypt/1234',
          pathParameters: { id: '1234' },
          body: JSON.stringify({
            secret: 'secret',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual('Internal error');
    });
  });

  describe('/encryptHandler', () => {
    it('works with a base64 body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: Buffer.from(
            JSON.stringify({
              message: 'lorem ipsum',
            }),
            'utf8',
          ).toString('base64'),
          isBase64Encoded: true,
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('works with a string body', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: JSON.stringify({
            message: 'lorem ipsum',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptLogic.encrypt).toHaveBeenCalledWith('lorem ipsum');
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns the encryption response', async () => {
      encryptLogic.encrypt.mockResolvedValue({ id: '1234', secret: 'secret' });
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: JSON.stringify({
            message: 'lorem ipsum',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(200);
      expect(encryptResponse.body).toEqual(JSON.stringify({ id: '1234', secret: 'secret' }));
    });

    it('returns an error if content-type is not set to json', async () => {
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: JSON.stringify({
            message: 'lorem ipsum',
          }),
          headers: {
            'Content-Type': 'plain/text',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(400);
      expect(JSON.parse(encryptResponse.body).reason).toEqual('Event object failed validation');
    });

    it('returns an error if request body is malformed', async () => {
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: JSON.stringify({
            errored_field: 'lorem ipsum',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(400);
      expect(JSON.parse(encryptResponse.body).reason).toEqual('Event object failed validation');
    });

    it('returns a 500 error if encryption fails', async () => {
      encryptLogic.encrypt.mockRejectedValue(new Error('error'));
      const encryptResponse = await encryptHandler(
        {
          path: '/encrypt',
          body: JSON.stringify({
            message: 'lorem ipsum',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        } as unknown as APIGatewayProxyEvent,
        {} as Context,
      );
      expect(encryptResponse.statusCode).toEqual(500);
      expect(encryptResponse.body).toEqual('Internal error');
    });
  });
});
