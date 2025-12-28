import {createSynclet} from 'synclets';
import {createBroadcastChannelTransport} from 'synclets/browser';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from 'synclets/memory';
import {expect, test} from 'vitest';
import {describeCommonSyncletTests} from '../common.ts';

describeCommonSyncletTests(
  async () => {},
  async () => {},
  <Depth extends number>(depth: Depth) => createMemoryDataConnector({depth}),
  <Depth extends number>(depth: Depth) => createMemoryMetaConnector({depth}),
  (uniqueId: string) =>
    createBroadcastChannelTransport({channelName: uniqueId}),
  2,
);

test('getChannelName', async () => {
  const transport = createBroadcastChannelTransport({
    channelName: 'test-channel',
  });
  const synclet = await createSynclet({transport});
  await synclet.start();

  expect(transport.getChannelName()).toEqual('test-channel');
  expect((synclet.getTransport()[0] as any).getChannelName()).toEqual(
    'test-channel',
  );

  await synclet.destroy();
});
