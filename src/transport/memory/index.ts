import type {MemoryTransport as MemoryTransportDecl} from '../../@types/transport/memory/index.d.ts';
import {BaseTransport} from '../index.ts';

export class MemoryTransport
  extends BaseTransport
  implements MemoryTransportDecl
{
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
