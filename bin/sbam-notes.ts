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
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { InputParameterType } from '../lib/input-parameter';
import { SbamNotesStack } from '../lib/sbam-notes-stack';

const app = new cdk.App();
new SbamNotesStack(app, 'SbamNotes', {
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
  storageConfig: {
    readCapacity: 1,
    writeCapacity: 1,
    tableClass: dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
  },
  apiConfig: {
    throttlingBurstLimit: 1000,
    throttlingRateLimit: 100,
  },
});
