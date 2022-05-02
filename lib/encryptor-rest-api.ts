import { CfnOutput, Names } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface EncryptorRestAPIDomainProps {
  hostedZone: r53.IHostedZone;
  apiSubdomain: string;
}

export interface EncryptorRestAPIProps {
  table: dynamodb.ITable;
  eventBus: events.IEventBus;
  logRetention?: logs.RetentionDays;
  customDomain?: EncryptorRestAPIDomainProps;
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
      deployOptions: {
        stageName: 'api',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['OPTIONS', 'POST'],
      },
    });
    this.restApi.root.addMethod('POST', new apigateway.LambdaIntegration(this.encryptHandler));
    this.restApi.root.addResource('{id}').addMethod('POST', new apigateway.LambdaIntegration(this.decryptHandler));

    if (props.customDomain) {
      this.addCustomDomain('Custom', props.customDomain);
    }
  }

  addCustomDomain(id: string, props: EncryptorRestAPIDomainProps) {
    const certificate = new acm.DnsValidatedCertificate(this, `${id}DomainCert`, {
      domainName: `${props.apiSubdomain}.${props.hostedZone.zoneName}`,
      hostedZone: props.hostedZone,
      cleanupRoute53Records: true,
      region: 'us-east-1',
    });
    const apiDomain = this.restApi.addDomainName(`${id}Domain`, {
      certificate,
      domainName: `${props.apiSubdomain}.${props.hostedZone.zoneName}`,
      endpointType: apigateway.EndpointType.EDGE,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });
    const target = r53.RecordTarget.fromAlias(new r53Targets.ApiGatewayDomain(apiDomain));
    new r53.ARecord(this, `${id}DomainARecord`, {
      zone: props.hostedZone,
      recordName: props.apiSubdomain,
      target,
    });
    new r53.AaaaRecord(this, `${id}DomainAaaaRecord`, {
      zone: props.hostedZone,
      recordName: props.apiSubdomain,
      target,
    });
    new CfnOutput(this, `${id}DomainEndpoint`, {
      value: `https://${apiDomain.domainName}`,
    });
  }
}
