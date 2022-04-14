import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { EncryptorRestAPI } from './encryptor-rest-api';

export interface EncryptorProps {
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
}

export class Encryptor extends Construct {
  readonly table: dynamodb.Table;
  readonly apiGateway: EncryptorRestAPI;

  constructor(scope: Construct, id: string, props?: EncryptorProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'EncryptedMessagesTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: 'TTL',
      removalPolicy: props?.removalPolicy,
    });
    this.apiGateway = new EncryptorRestAPI(this, 'EncryptorAPI', {
      table: this.table,
      logRetention: props?.logRetention,
    });
  }
}
