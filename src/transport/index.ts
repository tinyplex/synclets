import type {BaseTransport as BaseTransportDecl} from '../@types/transport/index.d.ts';

export class BaseTransport implements BaseTransportDecl {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}

  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
