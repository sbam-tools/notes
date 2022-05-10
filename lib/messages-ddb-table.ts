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
import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface StorageConfig {
  billingMode?: dynamodb.BillingMode;
  encryptionKey?: kms.IKey;
  readCapacity?: number;
  writeCapacity?: number;
  tableClass?: dynamodb.TableClass;
}

export interface MessagesDDBTableProps {
  config?: StorageConfig;
  removalPolicy?: RemovalPolicy;
}

export class MessagesDDBTable extends dynamodb.Table {
  constructor(scope: Construct, id: string, props: MessagesDDBTableProps) {
    super(scope, id, {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      timeToLiveAttribute: 'TTL',
      billingMode: props.config?.billingMode,
      encryptionKey: props.config?.encryptionKey,
      readCapacity: props.config?.readCapacity,
      writeCapacity: props.config?.writeCapacity,
      tableClass: props.config?.tableClass,
      removalPolicy: props.removalPolicy,
    });
  }
}
