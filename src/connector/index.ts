import type {Connector as ConnectorDecl} from '../@types/connector/index.d.ts';

export class Connector implements ConnectorDecl {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}
}
