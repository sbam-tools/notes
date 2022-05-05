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
import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface MessageCleanerProps {
  eventBus: events.IEventBus;
  table: dynamodb.ITable;
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
}

export class MessageCleaner extends Construct {
  constructor(scope: Construct, id: string, props: MessageCleanerProps) {
    super(scope, id);

    const queue = new sqs.Queue(this, 'Queue', {
      removalPolicy: props.removalPolicy,
    });

    new events.Rule(this, 'MessageDecrypted', {
      eventBus: props.eventBus,
      description: 'Delete message on decryption',
      eventPattern: {
        source: ['sbam.notes'],
        detailType: ['message decrypted'],
      },
      targets: [new eventTargets.SqsQueue(queue)],
    });

    const handler = new lambdaNode.NodejsFunction(this, 'Lambda', {
      entry: 'lambda/message-cleaner.handler.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      logRetention: props.logRetention,
    });
    props.table.grant(handler, 'dynamodb:BatchWriteItem', 'dynamodb:DeleteItem');
    handler.addEventSource(new lambdaEventSources.SqsEventSource(queue));
  }
}
