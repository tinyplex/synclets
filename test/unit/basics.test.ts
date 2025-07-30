import {createSynclet} from 'synclets';
import {Connector} from 'synclets/connector';
import {Transport} from 'synclets/transport';

test('basic test', () => {
  class MyConnector extends Connector {}
  class MyTransport extends Transport {}

  createSynclet(MyConnector, MyTransport);
  expect(true).toBe(true);
});
