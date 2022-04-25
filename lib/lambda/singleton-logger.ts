import { Logger } from '@aws-lambda-powertools/logger';
import { singleton } from 'tsyringe';

@singleton()
export class SingletonLogger extends Logger {
  constructor() {
    super();
  }
}
