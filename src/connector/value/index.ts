import {Connector} from '@synclets';
import type {Timestamp, Value} from '@synclets/@types';
import type {ValueConnector as ValueConnectorDecl} from '@synclets/@types/connector/value';

export class ValueConnector extends Connector implements ValueConnectorDecl {
  async getValue(): Promise<Value> {
    return null;
  }

  async setValue(_value: Value): Promise<void> {}

  async getValueTimestamp(): Promise<Timestamp> {
    return '';
  }

  async setValueTimestamp(_timestamp: Timestamp): Promise<void> {}
}
