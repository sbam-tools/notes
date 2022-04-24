export interface CreateMessageInput {
  id: string;
  encrypted: string;
  authTag: string;
  expireAt: Date;
}

export interface MessageDocument {
  encrypted: string;
  authTag: string;
}

export interface IMessagesRepository {
  create(message: CreateMessageInput): Promise<void>;
  find(id: string): Promise<MessageDocument>;
  delete(ids: string[]): Promise<void>;
}
