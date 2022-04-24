import { Construct } from 'constructs';
import * as path from 'path';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';

export interface EncryptorRestLambdaProps {
  table: dynamodb.ITable;
  eventBus?: events.IEventBus;
  logRetention?: logs.RetentionDays;
}

export class EncryptorRestLambda extends lambdaNode.NodejsFunction {
  constructor(scope: Construct, id: string, props: EncryptorRestLambdaProps) {
    super(scope, id, {
      entry: path.join(__dirname, './lambda/encryptor.handler.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
        EVENT_BUS_NAME: props.eventBus?.eventBusName || '',
      },
      logRetention: props.logRetention,
    });
    props.table.grant(this, 'dynamodb:GetItem', 'dynamodb:PutItem');
    props.eventBus?.grantPutEventsTo(this);
  }
}
