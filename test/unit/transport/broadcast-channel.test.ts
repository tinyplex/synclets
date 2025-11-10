import {createSynclet} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/connector/memory';
import {createBroadcastChannelTransport} from 'synclets/transport/broadcast-channel';
import {expect, test} from 'vitest';
import {describeCommonConnectorTests} from '../common.ts';

describeCommonConnectorTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector(depth),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector(depth),
  (uniqueId: string) => createBroadcastChannelTransport(uniqueId),
  2,
);

test('getChannelName', async () => {
  const transport = createBroadcastChannelTransport('test-channel');
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getChannelName()).toEqual('test-channel');
  expect((synclet.getTransport()[0] as any).getChannelName()).toEqual(
    'test-channel',
  );
});
