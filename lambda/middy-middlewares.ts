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

class RenderValidatorErrorMiddleware implements MiddlewareObj {
  static create() {
    return new RenderValidatorErrorMiddleware();
  }

  async onError(request: Request) {
    if (request.error && request.error.details) {
      const detail = request.error.details[0];
      request.error.message = `Validation error: ${detail.instancePath} ${detail.message}`;
    }
  }
}

export const renderValidatorErrorMiddleware = RenderValidatorErrorMiddleware.create;
