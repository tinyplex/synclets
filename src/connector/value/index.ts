import type {
  Timestamp,
  Value,
  ValueConnector as ValueConnectorDecl,
} from '../../@types/index.js';
import {Connector} from '../index.ts';

export class ValueConnector extends Connector implements ValueConnectorDecl {
  isValueConnector = true as const;

  async getValue(): Promise<Value> {
    return null;
  }

  async setValue(_value: Value): Promise<void> {}

  async getValueTimestamp(): Promise<Timestamp> {
    return '';
  }

  async setValueTimestamp(_timestamp: Timestamp): Promise<void> {}
}
