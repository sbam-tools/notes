import { Annotations, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cp from 'aws-cdk-lib/aws-codepipeline';
import * as cpActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { FrontendBuildProject } from './frontend-build-project';
import { InvalidateCloudfrontCodepipelineAction } from './invalidate-cloudfront-codepipeline-action';

export interface FrontendPipelineProps {
  codeStarConnectionArn: string;
  repository?: string;
  branch?: string;
  apiEndpoint: string;
  destinationBucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
  removalPolicy?: RemovalPolicy;
}

export class FrontendPipeline extends cp.Pipeline {
  constructor(scope: Construct, id: string, props: FrontendPipelineProps) {
    super(scope, id, {
      restartExecutionOnUpdate: true,
      stages: [{ stageName: 'Source' }, { stageName: 'Build' }, { stageName: 'Deploy' }, { stageName: 'Cleanup' }],
    });
    if (props.removalPolicy === RemovalPolicy.DESTROY) {
      this.artifactBucket.applyRemovalPolicy(props.removalPolicy);
    }

    const repositoryParts = props.repository ? props.repository.split('/') : ['sbam-cloud', 'notes-frontend'];
    if (repositoryParts.length !== 2) {
      Annotations.of(this).addError(
        'sourceRepository must be in the format <organization>/<repository> (e.g. sbam-cloud/notes-frontend)',
      );
    }

    const sourceArtifact = new cp.Artifact('Source');
    this.stage('Source').addAction(
      new cpActions.CodeStarConnectionsSourceAction({
        actionName: 'Source',
        connectionArn: props.codeStarConnectionArn,
        output: sourceArtifact,
        owner: repositoryParts[0],
        repo: repositoryParts[1],
        branch: props.branch,
      }),
    );
    const buildArtifact = new cp.Artifact('Build');
    this.stage('Build').addAction(
      new cpActions.CodeBuildAction({
        actionName: 'Build',
        input: sourceArtifact,
        project: new FrontendBuildProject(this, 'BuildProject', {
          apiEndpoint: props.apiEndpoint,
        }),
        outputs: [buildArtifact],
      }),
    );
    this.stage('Deploy').addAction(
      new cpActions.S3DeployAction({
        actionName: 'Deploy',
        bucket: props.destinationBucket,
        input: buildArtifact,
        cacheControl: [cpActions.CacheControl.maxAge(Duration.days(365))],
      }),
    );
    this.stage('Cleanup').addAction(
      new InvalidateCloudfrontCodepipelineAction(this, {
        actionName: 'InvalidateCloudfront',
        distribution: props.distribution,
      }),
    );
  }
}
