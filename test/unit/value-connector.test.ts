import {Synclet, Timestamp, Value} from 'synclets';
import {ValueConnector} from 'synclets/connector/value';
import {MemoryTransport} from 'synclets/transport/memory';

test('value sync', async () => {
  class TestValueConnector extends ValueConnector {
    #value: Value = 'V1';
    #timestamp: Timestamp = '';

    async getValue() {
      return this.#value;
    }
    async setValue(value: Value) {
      this.#value = value;
    }
    async getValueTimestamp() {
      return this.#timestamp;
    }
    async setValueTimestamp(timestamp: Timestamp) {
      this.#timestamp = timestamp;
    }

    getUnderlyingValue() {
      return this.#value;
    }
    async setUnderlyingValue(value: Value) {
      this.#value = value;
      await this.valueChanged();
    }
  }

  const connector1 = new TestValueConnector();
  const connector2 = new TestValueConnector();

  const synclet1 = new Synclet(connector1, new MemoryTransport());
  await synclet1.start();

  const synclet2 = new Synclet(connector2, new MemoryTransport());
  await synclet2.start();

  expect(connector1.getUnderlyingValue()).toEqual(
    connector2.getUnderlyingValue(),
  );

  await connector1.setUnderlyingValue('V2');
  expect(connector2.getUnderlyingValue()).toEqual('V2');
});
