export interface EncryptParams {
  key: Buffer;
  iv: Buffer;
  message: string;
}

export interface EncryptResult {
  encrypted: string;
  authTag: string;
}

export interface DecryptParams {
  key: Buffer;
  iv: Buffer;
  encrypted: string;
  authTag: string;
}

export interface IEncryptor {
  encrypt(request: EncryptParams): EncryptResult;
  decrypt(request: DecryptParams): string;
}

export interface DecryptRequest {
  id: string;
  secret: string;
}

export interface EncryptResponse {
  id: string;
  secret: string;
}

export interface IEncryptLogic {
  encrypt(message: string): Promise<EncryptResponse>;
  decrypt(request: DecryptRequest): Promise<string | undefined>;
}

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
}
