import { container } from 'tsyringe';
import { silenceLogger } from './helpers';

beforeEach(() => {
  container.clearInstances();
  jest.resetAllMocks();
  silenceLogger();
});
