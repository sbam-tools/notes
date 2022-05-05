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
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

const CODE = `function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Check whether the URI is missing a file name.
  if (uri.endsWith('/') || !uri.includes('.')) {
    request.uri = '/index.html';
  }

  return request;
}`;

export class SPACloudfrontFunction extends cf.Function {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: cf.FunctionCode.fromInline(CODE),
    });
  }
}
