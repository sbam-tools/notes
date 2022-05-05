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
import 'reflect-metadata';
import { container, inject, Lifecycle, registry, singleton } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { CodePipelineEvent } from 'aws-lambda';
import { CloudfrontService } from './services/cloudfront-service';
import { CodePipelineService } from './services/codepipeline-service';

interface CodePipelineActionConfig {
  distributionId: string;
  objectPaths: string[];
}

@registry([{ token: Logger, useClass: Logger, options: { lifecycle: Lifecycle.Singleton } }])
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
