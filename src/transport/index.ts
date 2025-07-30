import type {BaseTransport as BaseTransportDecl} from '../@types/transport/index.d.ts';

export class BaseTransport implements BaseTransportDecl {
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
