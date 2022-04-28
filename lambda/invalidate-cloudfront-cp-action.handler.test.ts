import { CodePipelineEvent } from "aws-lambda";
import { container } from "tsyringe";
import { CodePipelineAdapter } from "./invalidate-cloudfront-cp-action.handler";
import { CloudfrontService } from "./services/cloudfront-service";
import { CodePipelineService } from "./services/codepipeline-service";

describe('lambda/InvalidateCloudfrontCPAction', () => {
  const codePipelineService = {
    signalJobSuccess: jest.fn(),
    signalJobFailure: jest.fn(),
  };

  const cloudfrontService = {
    invalidate: jest.fn(),
  }

  let subject: CodePipelineAdapter;

  beforeEach(() => {
    container.registerInstance<unknown>(CodePipelineService, codePipelineService);
    container.registerInstance<unknown>(CloudfrontService, cloudfrontService);
    subject = container.resolve(CodePipelineAdapter);
  });

  it('invalidates cloudfront and notifies success', async () => {
    await subject.handle({
      "CodePipeline.job": {
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
      "CodePipeline.job": {
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
