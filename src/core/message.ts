import {Address, Hash, Timestamp, Value} from '@synclets/@types';
import type {Message} from './protected.d.ts';

export enum MessageType {
  Response = 0,
  Have = 1,
  Give = 2,
}

export const buildHaveMessage = (
  address: Address,
  timestamp: Timestamp,
  hash: Hash,
  to?: string,
): Message => ({
  type: MessageType.Have,
  address,
  timestamp,
  hash,
  ...(to ? {to} : {}),
});

export const buildGiveMessage = (
  address: Address,
  value: Value,
  timestamp: Timestamp,
  hash: Hash,
  to?: string,
): Message => ({
  type: MessageType.Give,
  address,
  value,
  timestamp,
  hash,
  ...(to ? {to} : {}),
});
