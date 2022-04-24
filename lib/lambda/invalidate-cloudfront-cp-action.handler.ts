import 'reflect-metadata';
import { container, inject, singleton } from 'tsyringe';
import { CodePipelineEvent } from 'aws-lambda';
import { CloudfrontService } from './services/cloudfront-service';
import { CodePipelineService } from './services/codepipeline-service';

interface CodePipelineActionConfig {
  distributionId: string;
  objectPaths: string[];
}

@singleton()
export class CodePipelineAdapter {
  constructor(
    @inject(CloudfrontService) private readonly cloudfront: CloudfrontService,
    @inject(CodePipelineService) private readonly codepipeline: CodePipelineService,
  ) {}

  async handle(event: CodePipelineEvent): Promise<void> {
    const job = event['CodePipeline.job'];
    const jobId = job.id;
    try {
      const params = JSON.parse(job.data.actionConfiguration.configuration.UserParameters) as CodePipelineActionConfig;
      await this.cloudfront.invalidate(params.distributionId, params.objectPaths, jobId);
      await this.codepipeline.signalJobSuccess(jobId);
    } catch (e) {
      console.error(e);
      await this.codepipeline.signalJobFailure(jobId, e);
    }
  }
}

export async function handler(event: CodePipelineEvent): Promise<void> {
  return container.resolve(CodePipelineAdapter).handle(event);
}
