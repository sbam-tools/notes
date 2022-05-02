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
