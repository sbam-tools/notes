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
