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
import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EncryptorRestAPI, EncryptorRestAPIDomainProps } from './encryptor-rest-api';
import { MessageCleaner } from './message-cleaner';
import { MessagesDDBTable, StorageConfig } from './messages-ddb-table';

export interface EncryptorProps {
  removalPolicy?: RemovalPolicy;
  logRetention?: logs.RetentionDays;
  customDomain?: EncryptorRestAPIDomainProps;
}

export class Encryptor extends Construct {
  readonly table: dynamodb.Table;
  readonly rest: EncryptorRestAPI;
  readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props?: EncryptorProps) {
    super(scope, id);

    this.eventBus = new events.EventBus(this, 'EventBus');

    this.table = new MessagesDDBTable(this, 'EncryptedMessagesTable', {
      config: props?.storageConfig,
      removalPolicy: props?.removalPolicy,
    });

    new MessageCleaner(this, 'MessageCleaner', {
      eventBus: this.eventBus,
      table: this.table,
      removalPolicy: props?.removalPolicy,
      logRetention: props?.logRetention,
    });

    this.rest = new EncryptorRestAPI(this, 'REST', {
      table: this.table,
      eventBus: this.eventBus,
      logRetention: props?.logRetention,
      customDomain: props?.customDomain,
    });
  }

  get restEndpoint(): string {
    return this.rest.restApi.deploymentStage.urlForPath();
  }
}
