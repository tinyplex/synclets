import type {Transport as TransportDecl} from '../@types/index.js';

export class Transport implements TransportDecl {
  async send(): Promise<void> {}

  async receive(): Promise<any> {}
}
