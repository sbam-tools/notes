/* eslint-disable @typescript-eslint/no-explicit-any */
import { MiddlewareObj } from '@middy/core';
import { Context } from 'aws-lambda/handler';

interface PossiblyDetailedError extends Error {
  statusCode?: number;
  expose?: boolean;
  details?: Array<Record<string, any>>;
}

interface Request<TEvent = any, TResult = any, TErr = PossiblyDetailedError, TCtx = Context> {
  event: TEvent;
  context: TCtx;
  response: TResult | null;
  error: TErr | null;
  internal: {
    [key: string]: any;
  };
}

class ErrorResponseInJsonMiddleware implements MiddlewareObj {
  static create() {
    return new ErrorResponseInJsonMiddleware();
  }

  onError = async (request: Request) => {
    if (request.error) {
      if (request.error.details) {
        request.error.message = JSON.stringify({ reason: request.error.message, details: request.error.details });
      } else {
        request.error.message = JSON.stringify({ reason: request.error.message });
      }
    }
  };
}

export const errorResponseInJsonMiddleware = ErrorResponseInJsonMiddleware.create;
