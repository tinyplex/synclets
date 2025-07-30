import {Transport} from './Transport.ts';

export class MemoryTransport extends Transport {
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
