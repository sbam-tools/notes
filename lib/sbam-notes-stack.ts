import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Encryptor } from './encryptor';
import { Frontend } from './frontend';
import { InputParameter, parseInputParameter } from './input-parameter';

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
