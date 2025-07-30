import type {Connector as ConnectorDecl} from '../@types/index.js';

export class Connector implements ConnectorDecl {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}
}
