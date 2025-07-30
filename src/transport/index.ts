import type {Transport as TransportDecl} from '../@types/transport/index.d.ts';

export class Transport implements TransportDecl {
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
