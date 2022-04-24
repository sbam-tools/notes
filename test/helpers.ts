import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import * as cdk from 'aws-cdk-lib';
import cdkJson = require('../cdk.json');

export const testCdkContext = {
  ...cdkJson.context,
  'aws:cdk:bundling-stacks': [],
};

export function cdkTestAppFactory(): cdk.App {
  return new cdk.App({ context: testCdkContext });
}

export function buildLocalDDBClient(): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
    region: 'local',
  }))
}
