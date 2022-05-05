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
