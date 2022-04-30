import { Construct } from "constructs";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import { Names } from "aws-cdk-lib";

export interface EncryptorRestAPIProps {
  table: dynamodb.ITable;
  eventBus: events.IEventBus;
  logRetention?: logs.RetentionDays;
}

export class EncryptorRestAPI extends Construct {
  readonly encryptHandler: lambdaNode.NodejsFunction;
  readonly decryptHandler: lambdaNode.NodejsFunction;
  readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: EncryptorRestAPIProps) {
    super(scope, id);

    this.encryptHandler = new lambdaNode.NodejsFunction(this, 'EncryptHandler', {
      entry: 'lambda/encryptor/rest-api.handlers.ts',
      handler: 'encryptHandler',
      logRetention: props.logRetention,
      environment: {
        TABLE_NAME: props.table.tableName,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
    });
    props.table.grant(this.encryptHandler, 'dynamodb:PutItem');
    props.eventBus.grantPutEventsTo(this.encryptHandler);

    this.decryptHandler = new lambdaNode.NodejsFunction(this, 'DecryptHandler', {
      entry: 'lambda/encryptor/rest-api.handlers.ts',
      handler: 'decryptHandler',
      logRetention: props.logRetention,
      environment: {
        TABLE_NAME: props.table.tableName,
        EVENT_BUS_NAME: props.eventBus.eventBusName,
      },
    });
    props.table.grant(this.decryptHandler, 'dynamodb:GetItem');
    props.eventBus.grantPutEventsTo(this.decryptHandler);

    this.restApi = new apigateway.RestApi(this, 'API', {
      description: 'SBAM Notes Encryptor API',
      restApiName: Names.uniqueId(this),
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST'],
      },
    });
    this.restApi.root.addMethod('POST', new apigateway.LambdaIntegration(this.encryptHandler));
    this.restApi.root.addResource('{id}').addMethod('POST', new apigateway.LambdaIntegration(this.decryptHandler));
  }
}
