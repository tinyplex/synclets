/// connector/value

import type {Connector, Timestamp, Value} from '../../index.js';

export class ValueConnector extends Connector {
  getValue(): Promise<Value>;

  setValue(value: Value): Promise<void>;

  getValueTimestamp(): Promise<Timestamp>;

  setValueTimestamp(timestamp: Timestamp): Promise<void>;
}
