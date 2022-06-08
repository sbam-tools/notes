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

export interface DecryptRequest {
  id: string;
  secret: string;
}

export interface EncryptResponse {
  id: string;
  secret: string;
}

export interface IEncryptor {
  encrypt(request: EncryptParams): EncryptResult;
  decrypt(request: DecryptParams): string;
}

export interface IEncryptLogic {
  encrypt(message: string): Promise<EncryptResponse>;
  decrypt(request: DecryptRequest): Promise<string | undefined>;
  detect(id: string): Promise<boolean>;
}
