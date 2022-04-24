import { Construct } from 'constructs';
import * as cpActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { InvalidateCloudfrontCodePipelineLambda } from './invalidate-cloudfront-lambda';
import { Stack } from 'aws-cdk-lib';

export interface InvalidateCloudfrontCodepipelineActionProps {
  actionName: string;
  distribution: cloudfront.IDistribution;
  objectPathsToInvalidate?: string[];
}

export class InvalidateCloudfrontCodepipelineAction extends cpActions.LambdaInvokeAction {
  constructor(scope: Construct, props: InvalidateCloudfrontCodepipelineActionProps) {
    const lambda = InvalidateCloudfrontCodePipelineLambda.findOrCreate(scope);
    super({
      actionName: props.actionName,
      lambda: lambda,
      userParameters: {
        distributionId: props.distribution.distributionId,
        objectPaths: props.objectPathsToInvalidate ?? ['/*'],
      },
    });
    lambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation'],
      resources: [
        Stack.of(scope).formatArn({
          service: 'cloudfront',
          region: '',
          resource: 'distribution',
          resourceName: props.distribution.distributionId,
        }),
      ],
    }));
  }
}
