import { Construct } from 'constructs';
import * as path from 'path';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface EncryptorRestLambdaProps {
  table: dynamodb.ITable;
  logRetention?: logs.RetentionDays;
}

export class EncryptorRestLambda extends lambdaNode.NodejsFunction {
  constructor(scope: Construct, id: string, props: EncryptorRestLambdaProps) {
    super(scope, id, {
      entry: path.join(__dirname, './lambda/encryptor/api-gateway-adapter.ts'),
      environment: {
        TABLE_NAME: props.table.tableName,
      },
      logRetention: props.logRetention,
    });
    this.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'dynamodb:DeleteItem',
        'dynamodb:PutItem',
      ],
      resources: [props.table.tableArn],
    }));
  }
}
