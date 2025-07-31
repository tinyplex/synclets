/// connector-value

import type {BaseConnector, Timestamp, Value} from '../index.d.ts';

export class ValueConnector extends BaseConnector {
  isValueConnector: true;

  getValue(): Promise<Value>;

  setValue(value: Value): Promise<void>;

  getValueTimestamp(): Promise<Timestamp>;

  setValueTimestamp(timestamp: Timestamp): Promise<void>;
}
