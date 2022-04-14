import * as cdk from 'aws-cdk-lib';
import cdkJson = require('../cdk.json');

export const testCdkContext = {
  ...cdkJson.context,
  'aws:cdk:bundling-stacks': [],
};


export function cdkTestAppFactory(): cdk.App {
  return new cdk.App({ context: testCdkContext });
}
