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
