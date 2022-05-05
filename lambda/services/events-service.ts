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
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

@singleton()
@registry([
  { token: 'EVENT_BRIDGE_CLIENT', useValue: new EventBridgeClient({}) },
  { token: 'EVENT_BUS_NAME', useValue: process.env.EVENT_BUS_NAME! },
])
export class EventBridgeService {
  constructor(
    @inject('EVENT_BRIDGE_CLIENT') private readonly client: EventBridgeClient,
    @inject('EVENT_BUS_NAME') private readonly eventBusName: string,
  ) {}

  async sendMessageEncrypted(id: string): Promise<void> {
    await this.client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.eventBusName !== '' ? this.eventBusName : undefined,
            Source: 'sbam.notes',
            DetailType: 'message encrypted',
            Detail: JSON.stringify({
              id,
            }),
          },
        ],
      }),
    );
  }

  async sendMessageDecrypted(id: string): Promise<void> {
    await this.client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: this.eventBusName !== '' ? this.eventBusName : undefined,
            Source: 'sbam.notes',
            DetailType: 'message decrypted',
            Detail: JSON.stringify({
              id,
            }),
          },
        ],
      }),
    );
  }
}
