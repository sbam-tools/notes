import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export enum InputParameterType {
  RAW,
  PARAMETER_STORE,
}

export interface InputParameter {
  value: string;
  type?: InputParameterType;
}

export function parseInputParameter(scope: Construct, id: string, input: InputParameter): string {
  if (input.type === InputParameterType.RAW) {
    return input.value;
  }
  const parameter = ssm.StringParameter.fromStringParameterName(scope, id, input.value);
  return parameter.stringValue;
}
