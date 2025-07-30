/// synclets

import type {BaseConnector} from './connector/index.d.ts';
import type {BaseTransport} from './transport/index.d.ts';
export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export type Class<C> = new (...args: any[]) => C;

export class Synclet<
  Connector extends BaseConnector,
  Transport extends BaseTransport,
> {
  constructor(
    connectorClass: Class<Connector>,
    transportClass: Class<Transport>,
  );
  getConnector(): Connector;
  getTransport(): Transport;

  getStarted(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
}
