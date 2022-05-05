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
