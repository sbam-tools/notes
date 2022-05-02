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
