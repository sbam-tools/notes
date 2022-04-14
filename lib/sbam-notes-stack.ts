import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Encryptor, EncryptorProps } from './encryptor';

export interface SbamNotesStackProps extends StackProps, EncryptorProps {
}

export class SbamNotesStack extends Stack {
  constructor(scope: Construct, id: string, props?: SbamNotesStackProps) {
    super(scope, id, props);

    new Encryptor(this, 'Encryptor', props);
  }
}
