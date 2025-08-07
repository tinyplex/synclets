import {Address, Timestamp, Value} from '@synclets/@types';
import type {Message} from './protected.d.ts';

export enum MessageType {
  HaveNode = 1,
  HaveNodes = 2,
  GiveNode = 3,
  GiveNodes = 4,
}

export const encodeHaveNode = (
  address: Address,
  timestamp: Timestamp,
): Message => [MessageType.HaveNode, address, timestamp];

export const encodeGiveNode = (
  address: Address,
  timestamp: Timestamp,
  value: Value,
): Message => [MessageType.GiveNode, address, timestamp, value];
