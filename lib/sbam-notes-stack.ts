import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Encryptor, EncryptorProps } from './encryptor';
import { Frontend } from './frontend';
import { InputParameter } from './input-parameter';

export interface SbamNotesStackProps extends StackProps, EncryptorProps {
  codeStarConnectionArn: InputParameter;
  frontend?: {
    repository?: string;
    branch?: string;
  }
}

export class SbamNotesStack extends Stack {
  constructor(scope: Construct, id: string, props: SbamNotesStackProps) {
    super(scope, id, props);

    const encryptor = new Encryptor(this, 'Encryptor', props);
    new Frontend(this, 'Frontend', {
      ...props,
      apiEndpoint: encryptor.restEndpoint,
      codeStarConnectionArn: props.codeStarConnectionArn,
      repository: props.frontend?.repository,
      branch: props.frontend?.branch,
    });
  }
}
