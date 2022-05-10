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
import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';

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
