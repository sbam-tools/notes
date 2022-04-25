import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { container } from 'tsyringe';
import cdkJson = require('../cdk.json');
import { SingletonLogger } from '../lib/lambda/singleton-logger';

export const testCdkContext = {
  ...cdkJson.context,
  'aws:cdk:bundling-stacks': [],
};

export function silenceLogger() {
  container.registerInstance<unknown>(SingletonLogger, {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  });
}

export function cdkTestAppFactory(): cdk.App {
  return new cdk.App({ context: testCdkContext });
}

export function buildLocalDDBClient(): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    region: 'local',
  }))
}
