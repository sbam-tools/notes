import 'reflect-metadata';
import { container, inject, Lifecycle, registry, singleton } from 'tsyringe';
import { CodePipelineEvent } from 'aws-lambda';
import { CloudfrontService } from './services/cloudfront-service';
import { CodePipelineService } from './services/codepipeline-service';
import { Logger } from '@aws-lambda-powertools/logger';

interface CodePipelineActionConfig {
  distributionId: string;
  objectPaths: string[];
}

@registry([
  { token: Logger, useClass: Logger, options: { lifecycle: Lifecycle.Singleton } }
])
@singleton()
export class CodePipelineAdapter {
  constructor(
    @inject(CloudfrontService) private readonly cloudfront: CloudfrontService,
    @inject(CodePipelineService) private readonly codepipeline: CodePipelineService,
    @inject(Logger) private readonly logger: Logger,
  ) {}

  async handle(event: CodePipelineEvent): Promise<void> {
    const job = event['CodePipeline.job'];
    const jobId = job.id;
    try {
      const params = JSON.parse(job.data.actionConfiguration.configuration.UserParameters) as CodePipelineActionConfig;
      this.logger.info('Invalidating CDN', { ...params, jobId });
      await this.cloudfront.invalidate(params.distributionId, params.objectPaths, jobId);
      await this.codepipeline.signalJobSuccess(jobId);
    } catch (e) {
      this.logger.error('Internal error', e as Error);
      await this.codepipeline.signalJobFailure(jobId, e);
    }
  }
}

export async function handler(event: CodePipelineEvent): Promise<void> {
  return container.resolve(CodePipelineAdapter).handle(event);
}
