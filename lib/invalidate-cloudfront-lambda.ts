import { Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const INVALIDATE_CLOUDFRONT_HANDLER_ID = 'InvalidateCloudfrontCodePipelineHandler';

export class InvalidateCloudfrontCodePipelineLambda extends lambdaNode.NodejsFunction {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      entry: 'lambda/invalidate-cloudfront-cp-action.handler.ts',
    });
  }

  static findOrCreate(scope: Construct, id?: string) {
    id ||= INVALIDATE_CLOUDFRONT_HANDLER_ID;
    const stack = Stack.of(scope);
    const existing = stack.node.tryFindChild(INVALIDATE_CLOUDFRONT_HANDLER_ID) as lambda.IFunction;
    if (existing) {
      return existing;
    }
    return new InvalidateCloudfrontCodePipelineLambda(stack, id);
  }
}
