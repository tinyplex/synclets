import type {MemoryTransport as MemoryTransportDecl} from '../../@types/transport/memory/index.d.ts';
import {Transport} from '../index.ts';

export class MemoryTransport extends Transport implements MemoryTransportDecl {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}

  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
