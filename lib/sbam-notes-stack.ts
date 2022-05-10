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
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Encryptor } from './encryptor';
import { Frontend } from './frontend';
import { InputParameter, parseInputParameter } from './input-parameter';
import { StorageConfig } from './messages-ddb-table';

interface CustomDomainConfig {
  hostedZone: r53.IHostedZone;
  apiSubdomain: string;
  frontendSubdomain: string;
}

export interface SbamNotesStackCustomDomainProps {
  hostedZoneId: InputParameter;
  hostedZoneName: InputParameter;
  apiSubdomain: InputParameter;
  frontendSubdomain: InputParameter;
}

export interface SbamNotesStackProps extends StackProps {
  logRetention?: logs.RetentionDays;
  removalPolicy?: RemovalPolicy;
  codeStarConnectionArn: InputParameter;
  frontend?: {
    repository?: string;
    branch?: string;
  };
  customDomain?: SbamNotesStackCustomDomainProps;
  storageConfig?: StorageConfig;
}

export class SbamNotesStack extends Stack {
  constructor(scope: Construct, id: string, props: SbamNotesStackProps) {
    super(scope, id, props);

    const logRetention = props.logRetention ?? logs.RetentionDays.ONE_WEEK;
    const removalPolicy = props.removalPolicy ?? RemovalPolicy.DESTROY;
    const codeStarConnectionArn = parseInputParameter(this, 'CodeStarConnectionArn', props.codeStarConnectionArn);
    const customDomain = this.parseCustomDomain(props.customDomain);

    const encryptor = new Encryptor(this, 'Encryptor', {
      logRetention,
      storageConfig: props.storageConfig,
      removalPolicy,
      customDomain,
    });
    new Frontend(this, 'Frontend', {
      logRetention,
      removalPolicy,
      apiEndpoint: customDomain
        ? `https://${customDomain.apiSubdomain}.${customDomain.hostedZone.zoneName}`
        : encryptor.restEndpoint,
      codeStarConnectionArn,
      repository: props.frontend?.repository,
      branch: props.frontend?.branch,
      customDomain,
    });
  }

  private parseCustomDomain(props?: SbamNotesStackCustomDomainProps): CustomDomainConfig | undefined {
    if (!props) {
      return undefined;
    }
    const hostedZone = r53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: parseInputParameter(this, 'HostedZoneId', props.hostedZoneId),
      zoneName: parseInputParameter(this, 'HostedZoneName', props.hostedZoneName),
    });
    return {
      hostedZone,
      apiSubdomain: parseInputParameter(this, 'ApiSubdomain', props.apiSubdomain),
      frontendSubdomain: parseInputParameter(this, 'FrontendSubdomain', props.frontendSubdomain),
    };
  }
}
