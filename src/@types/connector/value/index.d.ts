/// connector-value

import type {Connector, Timestamp, Value} from '../index.d.ts';

export class ValueConnector extends Connector {
  isValueConnector: true;

  getValue(): Promise<Value>;

  setValue(value: Value): Promise<void>;

  getValueTimestamp(): Promise<Timestamp>;

  setValueTimestamp(timestamp: Timestamp): Promise<void>;
}
