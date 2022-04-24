import { Construct } from "constructs";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { EncryptorRestLambda } from "./encryptor-rest-lambda";
import { Names } from "aws-cdk-lib";

export interface EncryptorRestAPIProps {
  table: dynamodb.ITable;
  logRetention?: logs.RetentionDays;
}

export class EncryptorRestAPI extends Construct {
  readonly encryptorHandler: EncryptorRestLambda;
  readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: EncryptorRestAPIProps) {
    super(scope, id);

    this.encryptorHandler = new EncryptorRestLambda(this, 'Handler', {
      table: props.table,
      logRetention: props.logRetention,
    });
    this.restApi = new apigateway.LambdaRestApi(this, 'API', {
      handler: this.encryptorHandler,
      description: 'SBAM Notes Encryptor API',
      restApiName: Names.uniqueId(this),
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST'],
      },
      proxy: false,
    });
    this.restApi.root.addResource('encrypt').addMethod('POST');
    this.restApi.root.addResource('decrypt').addResource('{id}').addMethod('POST');
  }
}
