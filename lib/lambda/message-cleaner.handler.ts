import 'reflect-metadata';
import { container, inject, registry, singleton } from "tsyringe";
import { EventBridgeEvent, SQSEvent } from "aws-lambda";
import { DDBMessagesRepository } from "./repositories/ddb-messages-repository";
import { IMessagesRepository } from "./repositories/interfaces";

interface MessageDecryptedEventDetail {
  id: string;
}

@registry([
  { token: 'IMessagesRepository', useClass: DDBMessagesRepository },
])
@singleton()
export class SQSAdapter {
  constructor(
    @inject('IMessagesRepository') private readonly repository: IMessagesRepository,
  ) {}

  async handle(event: SQSEvent) {
    const ids = event.Records.map(r => {
      const event = JSON.parse(r.body) as EventBridgeEvent<'message decrypted', MessageDecryptedEventDetail>
      return event.detail.id;
    });
    console.log('Deleting messages', { ids })
    await this.repository.delete(ids);
  }
}

export async function handler(event: SQSEvent): Promise<void> {
  return container.resolve(SQSAdapter).handle(event);
}
