import {Synclet} from 'synclets';
import {ValueConnector} from 'synclets/connector/value';
import {MemoryTransport} from 'synclets/transport/memory';

test('constructor', () => {
  const synclet = new Synclet(ValueConnector, MemoryTransport);
  expect(synclet).toBeInstanceOf(Synclet);
});

test('value via memory', async () => {
  class TestValueConnector extends ValueConnector {
    private value: string = '';
    async getValue() {
      return this.value;
    }
    async setValue(value: string) {
      this.value = value;
    }
    getUnderlyingValue() {
      return this.value;
    }
    setUnderlyingValue(value: string) {
      this.value = value;
    }
  }

  const synclet1 = new Synclet(TestValueConnector, MemoryTransport);
  const synclet2 = new Synclet(TestValueConnector, MemoryTransport);

  expect(synclet1.getConnector().getUnderlyingValue()).toEqual(
    synclet2.getConnector().getUnderlyingValue(),
  );
});
