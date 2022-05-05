#!/usr/bin/env node
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
