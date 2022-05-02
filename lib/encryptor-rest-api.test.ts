import { CfnElement, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { cdkTestAppFactory } from '../test/helpers';
import { EncryptorRestAPI } from './encryptor-rest-api';

describe('constructs/RestEncryptorAPI', () => {
  let stack: Stack;
  let table: dynamodb.Table;
  let tableLogicalId: string;
  let eventBus: events.EventBus;

  beforeEach(() => {
    const app = cdkTestAppFactory();
    stack = new Stack(app, 'TestStack');
    table = new dynamodb.Table(stack, 'Table', {
      tableName: 'table',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
    });
    tableLogicalId = stack.getLogicalId(table.node.defaultChild as CfnElement);
    eventBus = new events.EventBus(stack, 'EventBus');
  });

  it('defines the encryptor handler', () => {
    new EncryptorRestAPI(stack, 'API', {
      table,
      eventBus,
    });
    const template = Template.fromStack(stack);
    template.hasResource('AWS::Lambda::Function', {
      Properties: {
        Environment: {
          Variables: {
            TABLE_NAME: {
              Ref: tableLogicalId,
            },
          },
        },
      },
    });
  });

  it('defines the Rest API', () => {
    new EncryptorRestAPI(stack, 'API', {
      table,
      eventBus,
    });
    const template = Template.fromStack(stack);
    template.hasResource('AWS::ApiGateway::RestApi', {
      Properties: {
        Name: Match.stringLikeRegexp('^TestStackAPI'),
      },
    });
  });
});
