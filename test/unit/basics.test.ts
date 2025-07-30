import {createSynclet} from 'synclets';

test('basic test', () => {
  class Connector {
    async connect() {}
    async disconnect() {}
  }
  class Transport {
    async send() {}
    async receive() {
      return {};
    }
  }
  createSynclet(Connector, Transport);
  expect(true).toBe(true);
});
