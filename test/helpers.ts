import { container } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import * as cdk from 'aws-cdk-lib';

import cdkJson = require('../cdk.json');

export const testCdkContext = {
  ...cdkJson.context,
  'aws:cdk:bundling-stacks': [],
};

export function silenceLogger() {
  container.registerInstance<unknown>(Logger, {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  });
}

export function cdkTestAppFactory(): cdk.App {
  return new cdk.App({ context: testCdkContext });
}

export function buildLocalDDBClient(): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
      region: 'local',
    }),
  );
}
