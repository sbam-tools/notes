export class DecryptError extends Error {
  constructor() {
    super('Error decrypting message');
  }
}

export class MessageNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`Cannot find message with id '${id}'`);
  }
}
