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
