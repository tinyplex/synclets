import type {Timestamp, Value} from '../../@types/connector/index.d.ts';
import type {ValueConnector as ValueConnectorDecl} from '../../@types/connector/value/index.d.ts';
import {BaseConnector} from '../index.ts';

export class ValueConnector
  extends BaseConnector
  implements ValueConnectorDecl
{
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
