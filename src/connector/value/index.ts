import {Connector} from '@synclets';
import type {Address, Timestamp, Value} from '@synclets/@types';
import type {ValueConnector as ValueConnectorDecl} from '@synclets/@types/connector/value';

export class ValueConnector extends Connector implements ValueConnectorDecl {
  async getNode(_address: Address): Promise<Value> {
    return this.getValue();
  }

  async getNodeTimestamp(_address: Address): Promise<Timestamp> {
    return this.getValueTimestamp();
  }

  async setNode(_address: Address, value: Value): Promise<void> {
    this.setValue(value);
  }

  async setNodeTimestamp(
    _address: Address,
    timestamp: Timestamp,
  ): Promise<void> {
    this.setValueTimestamp(timestamp);
  }

  // ---

  async valueChanged(): Promise<void> {
    await this.nodeChanged([]);
  }

  async getValue(): Promise<Value> {
    return null;
  }

  async setValue(_value: Value): Promise<void> {}

  async getValueTimestamp(): Promise<Timestamp> {
    return '';
  }

  async setValueTimestamp(_timestamp: Timestamp): Promise<void> {}
}
