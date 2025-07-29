import {createSynchronizer} from 'synclets';

test('basic test', () => {
  const connector = {
    connect: async () => {},
    disconnect: async () => {},
  };
  const transport = {
    send: async () => {},
    receive: async () => ({}),
  };
  createSynchronizer(connector, transport);
  expect(true).toBe(true);
});
