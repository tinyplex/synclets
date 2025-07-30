import {Synclet} from 'synclets';
import {Connector} from 'synclets/connector';
import {Transport} from 'synclets/transport';

test('basic test', () => {
  class MyConnector extends Connector {}
  class MyTransport extends Transport {}

  const _synclet = new Synclet(MyConnector, MyTransport);
  expect(_synclet).toBeInstanceOf(Synclet);
});
