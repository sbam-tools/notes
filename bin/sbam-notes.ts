#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { InputParameterType } from '../lib/input-parameter';
import { SbamNotesStack } from '../lib/sbam-notes-stack';

const app = new cdk.App();
new SbamNotesStack(app, 'SbamNotes', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
  codeStarConnectionArn: {
    value: '/sbam/codestar-connection-arn',
    type: InputParameterType.PARAMETER_STORE,
  },
  customDomain: {
    hostedZoneId: {
      value: '/sbam/hosted-zone-id',
      type: InputParameterType.PARAMETER_STORE,
    },
    hostedZoneName: {
      value: '/sbam/hosted-zone-name',
      type: InputParameterType.PARAMETER_STORE,
    },
    apiSubdomain: {
      value: '/sbam/notes/api-domain-name',
      type: InputParameterType.PARAMETER_STORE,
    },
    frontendSubdomain: {
      value: '/sbam/notes/frontend-domain-name',
      type: InputParameterType.PARAMETER_STORE,
    },
  },
});
