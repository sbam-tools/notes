import { inject, registry, singleton } from 'tsyringe';
import {
  CodePipelineClient,
  PutJobFailureResultCommand,
  PutJobSuccessResultCommand,
} from '@aws-sdk/client-codepipeline';

@registry([{ token: 'CODEPIPELINE_CLIENT', useValue: new CodePipelineClient({}) }])
@singleton()
export class CodePipelineService {
  constructor(@inject('CODEPIPELINE_CLIENT') private readonly client: CodePipelineClient) {}

  async signalJobSuccess(jobId: string): Promise<void> {
    await this.client.send(
      new PutJobSuccessResultCommand({
        jobId,
      }),
    );
  }

  async signalJobFailure(jobId: string, e: unknown): Promise<void> {
    await this.client.send(
      new PutJobFailureResultCommand({
        jobId,
        failureDetails: {
          type: 'JobFailed',
          message: e instanceof Error ? e.message : (e as string),
        },
      }),
    );
  }
}
