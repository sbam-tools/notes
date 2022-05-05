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
import { Stack } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cpActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { InvalidateCloudfrontCodePipelineLambda } from './invalidate-cloudfront-lambda';

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
    lambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          Stack.of(scope).formatArn({
            service: 'cloudfront',
            region: '',
            resource: 'distribution',
            resourceName: props.distribution.distributionId,
          }),
        ],
      }),
    );
  }
}
