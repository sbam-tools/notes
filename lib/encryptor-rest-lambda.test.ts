import { CfnElement, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { cdkTestAppFactory } from '../test/helpers';
import { EncryptorRestLambda } from './encryptor-rest-lambda';

describe('constructs/RestEncryptorLambda', () => {
  let stack: Stack;
  let table: dynamodb.Table;
  let tableLogicalId: string;

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
  });

  it('defines a lambda function', () => {
    new EncryptorRestLambda(stack, 'Function', {
      table,
    })
    const template = Template.fromStack(stack);
    template.hasResource('AWS::Lambda::Function', {
      Properties: {
        Environment: {
          Variables: {
            TABLE_NAME: {
              Ref: tableLogicalId,
            }
          }
        },
        Handler: 'index.handler',
        Runtime: 'nodejs14.x',
      },
    });
  });

  it('grants permissions over ddb table', () => {
    const fn = new EncryptorRestLambda(stack, 'Function', {
      table,
    });
    const roleLogicaId = stack.getLogicalId(fn.role!.node.defaultChild as CfnElement)
    const template = Template.fromStack(stack);
    template.hasResource('AWS::IAM::Policy', {
      Properties: {
        PolicyDocument: {
          Statement: [{
            Action: [
              'dynamodb:DeleteItem',
              'dynamodb:PutItem',
            ],
            Effect: 'Allow',
            Resource: {
              'Fn::GetAtt': [tableLogicalId, 'Arn'],
            },
          }],
        },
        Roles: [{ Ref: roleLogicaId }],
      },
    });
  });
});
