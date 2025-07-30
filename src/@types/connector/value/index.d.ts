/// connector-value

import type {Timestamp, Value} from '../../index.d.ts';
import type {Connector} from '../index.d.ts';

export interface ValueConnector extends Connector {
  isValueConnector: true;
  getValue(): Promise<Value>;
  setValue(value: Value): Promise<void>;

  getValueTimestamp(): Promise<Timestamp>;
  setValueTimestamp(timestamp: Timestamp): Promise<void>;
}
