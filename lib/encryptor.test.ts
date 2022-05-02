import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { cdkTestAppFactory } from '../test/helpers';
import { Encryptor } from './encryptor';

describe('constructs/Encryptor', () => {
  let stack: Stack;

  beforeEach(() => {
    const app = cdkTestAppFactory();
    stack = new Stack(app, 'TestStack');
  });

  it('defines the DDB Table', () => {
    new Encryptor(stack, 'Encryptor');
    const template = Template.fromStack(stack);
    template.hasResource('AWS::DynamoDB::Table', {
      Properties: {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        TimeToLiveSpecification: {
          AttributeName: 'TTL',
          Enabled: true,
        },
      },
    });
  });

  it('defines the api', () => {
    new Encryptor(stack, 'Encryptor');
    const template = Template.fromStack(stack);
    template.hasResource('AWS::ApiGateway::RestApi', {});
  });
});
