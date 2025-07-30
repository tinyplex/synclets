import type {Transport as MemoryTransportDecl} from '../../@types/transport/index.d.ts';
import {Transport} from '../index.ts';

export class MemoryTransport extends Transport implements MemoryTransportDecl {
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
