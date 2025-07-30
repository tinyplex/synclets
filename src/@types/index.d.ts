/// synclets

import type {ConnectorClass} from './connector/index.d.ts';
import type {TransportClass} from './transport/index.d.ts';

export type DeletedValue = '\uFFFC';

export type Timestamp = string;

export type Value = string | number | boolean | null | DeletedValue;

export interface Synclet {
  start(): void;
  stop(): void;
}

export function createSynclet(
  connector: ConnectorClass,
  transport: TransportClass,
): Synclet;
