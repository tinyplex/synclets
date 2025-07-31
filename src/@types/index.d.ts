/// synclets

import type {Connector as BaseConnector} from './connector/index.d.ts';
import type {Transport as BaseTransport} from './transport/index.d.ts';

export class Synclet<
  Connector extends BaseConnector,
  Transport extends BaseTransport,
> {
  constructor(connector: Connector, transport: Transport);

  getConnector(): Connector;

  getTransport(): Transport;

  getStarted(): boolean;

  start(): Promise<void>;

  stop(): Promise<void>;
}
