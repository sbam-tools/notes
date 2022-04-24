import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib";
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';

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
      targets: [
        new eventTargets.SqsQueue(queue),
      ],
    });

    const handler = new lambdaNode.NodejsFunction(this, 'Lambda', {
      entry: 'lib/lambda/message-cleaner.handler.ts',
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      logRetention: props.logRetention,
    });
    props.table.grant(handler, 'dynamodb:BatchWriteItem', 'dynamodb:DeleteItem');
    handler.addEventSource(new lambdaEventSources.SqsEventSource(queue));
  }
}
