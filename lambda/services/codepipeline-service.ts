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
