import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { EncryptorRestAPI } from './encryptor-rest-api';
import { MessageCleaner } from './message-cleaner';

export interface EncryptorProps {
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
}

export class Encryptor extends Construct {
  readonly table: dynamodb.Table;
  readonly rest: EncryptorRestAPI;
  readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props?: EncryptorProps) {
    super(scope, id);

    this.eventBus = new events.EventBus(this, 'EventBus');

    this.table = new dynamodb.Table(this, 'EncryptedMessagesTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: 'TTL',
      removalPolicy: props?.removalPolicy,
    });

    new MessageCleaner(this, 'MessageCleaner', {
      eventBus: this.eventBus,
      table: this.table,
      removalPolicy: props?.removalPolicy,
      logRetention: props?.logRetention,
    });

    this.rest = new EncryptorRestAPI(this, 'REST', {
      table: this.table,
      eventBus: this.eventBus,
      logRetention: props?.logRetention,
    });
  }

  get restEndpoint(): string {
    return this.rest.restApi.deploymentStage.urlForPath();
  }
}
