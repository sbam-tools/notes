import { RemovalPolicy } from 'aws-cdk-lib';
import * as cf from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { FrontendPipeline } from './frontend-pipeline';
import { SPACloudfrontFunction } from './spa-routing-cloudfront-function';

export interface FrontendProps {
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
  apiEndpoint: string;
  codeStarConnectionArn: string;
  repository?: string;
  branch?: string;
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

    this.distribution = new cf.Distribution(this, 'CDN', {
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
}
