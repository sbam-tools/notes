import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { inject, registry, singleton } from "tsyringe";

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

  async sendMessageDecrypted(id: string): Promise<void> {
    await this.client.send(new PutEventsCommand({
      Entries: [{
        EventBusName: this.eventBusName !== '' ? this.eventBusName : undefined,
        Source: 'sbam.notes',
        DetailType: 'message decrypted',
        Detail: JSON.stringify({
          id,
        }),
      }],
    }));
  }
}
