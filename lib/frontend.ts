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
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { FrontendPipeline } from './frontend-pipeline';
import { SPACloudfrontFunction } from './spa-routing-cloudfront-function';

export interface FrontendCustomDomainProps {
  hostedZone: r53.IHostedZone;
  frontendSubdomain: string;
}
export interface FrontendProps {
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
  apiEndpoint: string;
  codeStarConnectionArn: string;
  repository?: string;
  branch?: string;
  customDomain?: FrontendCustomDomainProps;
}

export class Frontend extends Construct {
  readonly bucket: s3.Bucket;
  readonly distribution: cf.Distribution;

  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      autoDeleteObjects: props?.removalPolicy === RemovalPolicy.DESTROY,
      removalPolicy: props?.removalPolicy,
    });

    const certificate = props.customDomain
      ? this.createDnsValidatedCertificate('Custom', props.customDomain)
      : undefined;

    this.distribution = new cf.Distribution(this, 'CDN', {
      certificate,
      domainNames: props.customDomain
        ? [`${props.customDomain.frontendSubdomain}.${props.customDomain.hostedZone.zoneName}`]
        : undefined,
      defaultBehavior: {
        origin: new cfOrigins.S3Origin(this.bucket),
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cf.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        functionAssociations: [
          {
            eventType: cf.FunctionEventType.VIEWER_REQUEST,
            function: new SPACloudfrontFunction(this, 'RoutingFunction'),
          },
        ],
      },
      defaultRootObject: 'index.html',
    });

    if (props.customDomain) {
      this.createDnsRecords('Custom', props.customDomain);
    }

    new FrontendPipeline(this, 'Pipeline', {
      apiEndpoint: props.apiEndpoint,
      codeStarConnectionArn: props.codeStarConnectionArn,
      destinationBucket: this.bucket,
      distribution: this.distribution,
      repository: props.repository,
      branch: props.branch,
      removalPolicy: props.removalPolicy,
    });
  }

  private createDnsValidatedCertificate(id: string, props: FrontendCustomDomainProps): acm.ICertificate {
    return new acm.DnsValidatedCertificate(this, `${id}DomainCert`, {
      domainName: `${props.frontendSubdomain}.${props.hostedZone.zoneName}`,
      hostedZone: props.hostedZone,
      cleanupRoute53Records: true,
      region: 'us-east-1',
    });
  }

  private createDnsRecords(id: string, props: FrontendCustomDomainProps) {
    const target = r53.RecordTarget.fromAlias(new r53Targets.CloudFrontTarget(this.distribution));
    new r53.ARecord(this, `${id}DomainARecord`, {
      zone: props.hostedZone,
      recordName: props.frontendSubdomain,
      target,
    });
    new r53.AaaaRecord(this, `${id}DomainAaaaRecord`, {
      zone: props.hostedZone,
      recordName: props.frontendSubdomain,
      target,
    });
    new CfnOutput(this, `${id}DomainEndpoint`, {
      value: `https://${props.frontendSubdomain}.${props.hostedZone.zoneName}`,
    });
  }
}
