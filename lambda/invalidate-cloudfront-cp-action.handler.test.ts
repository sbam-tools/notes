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
import { container } from 'tsyringe';
import { CodePipelineEvent } from 'aws-lambda';
import { CodePipelineAdapter } from './invalidate-cloudfront-cp-action.handler';
import { CloudfrontService } from './services/cloudfront-service';
import { CodePipelineService } from './services/codepipeline-service';

describe('lambda/InvalidateCloudfrontCPAction', () => {
  const codePipelineService = {
    signalJobSuccess: jest.fn(),
    signalJobFailure: jest.fn(),
  };

  const cloudfrontService = {
    invalidate: jest.fn(),
  };

  let subject: CodePipelineAdapter;

  beforeEach(() => {
    container.registerInstance<unknown>(CodePipelineService, codePipelineService);
    container.registerInstance<unknown>(CloudfrontService, cloudfrontService);
    subject = container.resolve(CodePipelineAdapter);
  });

  it('invalidates cloudfront and notifies success', async () => {
    await subject.handle({
      'CodePipeline.job': {
        id: '1234',
        data: {
          actionConfiguration: {
            configuration: {
              UserParameters: JSON.stringify({
                distributionId: 'foobar',
                objectPaths: ['/*'],
              }),
            },
          },
        },
      },
    } as CodePipelineEvent);
    expect(cloudfrontService.invalidate).toHaveBeenCalledWith('foobar', ['/*'], '1234');
    expect(codePipelineService.signalJobSuccess).toHaveBeenCalledWith('1234');
  });

  it('notifies failure if cloudfront invalidation fails', async () => {
    cloudfrontService.invalidate.mockRejectedValue('lorem');
    await subject.handle({
      'CodePipeline.job': {
        id: '1234',
        data: {
          actionConfiguration: {
            configuration: {
              UserParameters: JSON.stringify({
                distributionId: 'foobar',
                objectPaths: ['/*'],
              }),
            },
          },
        },
      },
    } as CodePipelineEvent);
    expect(codePipelineService.signalJobSuccess).not.toHaveBeenCalled();
    expect(codePipelineService.signalJobFailure).toHaveBeenCalledWith('1234', 'lorem');
  });
});
