import type {ValueConnector as ValueConnectorDecl} from '../../@types/connector/value/index.d.ts';
import type {Timestamp, Value} from '../../@types/index.js';
import {Connector} from '../../index.ts';

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
