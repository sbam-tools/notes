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
import { Logger } from '@aws-lambda-powertools/logger';
import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import jsonBodyParser from '@middy/http-json-body-parser';
import requestValidator from '@middy/validator';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errorResponseInJsonMiddleware } from '../middy-middlewares';

type APIGatewayHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function middify(fn: APIGatewayHandler, inputSchema: Record<string, any>) {
  return middy(fn)
    .use(httpEventNormalizer())
    .use(httpHeaderNormalizer())
    .use(jsonBodyParser())
    .use(requestValidator({ inputSchema }))
    .use(errorResponseInJsonMiddleware())
    .use(httpCors())
    .use(
      httpErrorHandler({
        logger: (e) => container.resolve(Logger).error(e),
        fallbackMessage: 'Internal error',
      }),
    );
}
