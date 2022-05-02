import 'reflect-metadata';
import { container, inject, Lifecycle, registry, singleton } from 'tsyringe';
import { Logger } from '@aws-lambda-powertools/logger';
import { EventBridgeEvent, SQSEvent } from 'aws-lambda';
import { DDBMessagesRepository } from './repositories/ddb-messages-repository';
import { IMessagesRepository } from './repositories/interfaces';

interface MessageDecryptedEventDetail {
  id: string;
}

@registry([
  { token: 'IMessagesRepository', useClass: DDBMessagesRepository, options: { lifecycle: Lifecycle.Singleton } },
  { token: Logger, useClass: Logger, options: { lifecycle: Lifecycle.Singleton } },
])
@singleton()
export class SQSAdapter {
  constructor(
    @inject('IMessagesRepository') private readonly repository: IMessagesRepository,
    @inject(Logger) private readonly logger: Logger,
  ) {}

  async handle(event: SQSEvent) {
    const ids = event.Records.map((r) => {
      const event = JSON.parse(r.body) as EventBridgeEvent<'message decrypted', MessageDecryptedEventDetail>;
      return event.detail.id;
    });
    this.logger.info('Deleting messages', { ids });
    await this.repository.delete(ids);
  }
}

export async function handler(event: SQSEvent): Promise<void> {
  return container.resolve(SQSAdapter).handle(event);
}
