import type {BaseConnector as BaseConnectorDecl} from '../@types/connector/index.d.ts';

export class BaseConnector implements BaseConnectorDecl {
  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}
}
