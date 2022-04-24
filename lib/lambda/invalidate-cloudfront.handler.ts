import { CodePipelineEvent } from 'aws-lambda';
import { CodePipelineClient, PutJobFailureResultCommand, PutJobSuccessResultCommand } from '@aws-sdk/client-codepipeline';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';

interface CodePipelineActionConfig {
  distributionId: string;
  objectPaths: string[];
}

const codepipeline = new CodePipelineClient({});
const cloudfront = new CloudFrontClient({});

export async function handler(event: CodePipelineEvent): Promise<void> {
  const job = event['CodePipeline.job'];
  const jobId = job.id;
  try {
    const params = JSON.parse(job.data.actionConfiguration.configuration.UserParameters) as CodePipelineActionConfig;
    await cloudfront.send(new CreateInvalidationCommand({
      DistributionId: params.distributionId,
      InvalidationBatch: {
        Paths: {
          Items: params.objectPaths,
          Quantity: params.objectPaths.length,
        },
        CallerReference: jobId,
      },
    }));
    await codepipeline.send(new PutJobSuccessResultCommand({
      jobId,
    }));
  } catch (e) {
    console.error(e);
    await codepipeline.send(new PutJobFailureResultCommand({
      jobId,
      failureDetails: {
        type: 'JobFailed',
        message: e instanceof Error ? e.message : e as string,
      },
    }));
  }
}
