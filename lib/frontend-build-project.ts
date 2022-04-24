import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export interface FrontendBuildProjectProps {
  apiEndpoint: string;
}

export class FrontendBuildProject extends codebuild.PipelineProject {
  constructor(scope: Construct, id: string, props: FrontendBuildProjectProps) {
    super(scope, id, {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        environmentVariables: {
          VITE_API_ENDPOINT: {
            value: props.apiEndpoint,
          },
        },
      },
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '14',
            },
            commands: [
              'npm ci'
            ],
          },
          build: {
            commands: [
              'npm run build'
            ],
          },
        },
        artifacts: {
          files: [
            '**/*',
          ],
          'base-directory': 'dist',
        },
        cache: {
          paths: [
            'node_modules/**/*',
          ],
        },
      }),
    });
  }
}
