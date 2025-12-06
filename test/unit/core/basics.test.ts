import {
  createSynclet,
  type DataConnector,
  type MetaConnector,
  type Transport,
} from 'synclets';
import {createMemoryTransport} from 'synclets/memory';
import {beforeEach, describe, expect, test, vi} from 'vitest';
import {
  createMockDataConnector,
  createMockMetaConnector,
  createMockTransport,
} from '../common.ts';

let dataConnector: DataConnector<1>;
let metaConnector: MetaConnector<1>;
let transport: Transport;

beforeEach(async () => {
  dataConnector = createMockDataConnector(1);
  metaConnector = createMockMetaConnector(1);
  transport = createMockTransport();
});

describe('createSynclet', () => {
  test('plain', async () => {
    const synclet = await createSynclet({
      dataConnector,
      metaConnector,
      transport,
    });
    expect(synclet).toBeDefined();

    await synclet.destroy();
  });

  test('error when only dataConnector provided', async () => {
    await expect(
      createSynclet({
        dataConnector: createMockDataConnector(1),
      }),
    ).rejects.toThrow('both connectors must be provided, or both omitted');
  });

  test('error when only metaConnector provided', async () => {
    await expect(
      createSynclet({
        metaConnector: createMockMetaConnector(1),
      }),
    ).rejects.toThrow('both connectors must be provided, or both omitted');
  });

  test('no connectors, only transport', async () => {
    const transport = createMockTransport();
    const synclet = await createSynclet({
      transport,
    });

    expect(synclet).toBeDefined();
    expect(synclet.getDataConnector()).toBeUndefined();
    expect(synclet.getMetaConnector()).toBeUndefined();
    expect(synclet.getTransport()).toEqual([transport]);

    await synclet.start();

    const data = await synclet.getData();
    expect(data).toEqual({});

    const meta = await synclet.getMeta();
    expect(meta).toEqual({});

    await synclet.stop();
    await synclet.destroy();
  });

  test('no connectors, no transport', async () => {
    const synclet = await createSynclet({});

    expect(synclet).toBeDefined();
    expect(synclet.getDataConnector()).toBeUndefined();
    expect(synclet.getMetaConnector()).toBeUndefined();
    expect(synclet.getTransport()).toEqual([]);

    await synclet.start();
    await synclet.stop();
    await synclet.destroy();
  });

  test('full synclet: both connectors provided', async () => {
    const dataConnector = createMockDataConnector(1);
    const metaConnector = createMockMetaConnector(1);
    const transport = createMockTransport();

    const synclet = await createSynclet({
      dataConnector,
      metaConnector,
      transport,
    });

    expect(synclet).toBeDefined();
    expect(synclet.getDataConnector()).toBe(dataConnector);
    expect(synclet.getMetaConnector()).toBe(metaConnector);
    expect(synclet.getTransport()).toEqual([transport]);

    await synclet.start();
    await synclet.stop();
    await synclet.destroy();
  });

  test('local-only synclet: both connectors, no transport', async () => {
    const dataConnector = createMockDataConnector(1);
    const metaConnector = createMockMetaConnector(1);

    const synclet = await createSynclet({
      dataConnector,
      metaConnector,
    });

    expect(synclet).toBeDefined();
    expect(synclet.getDataConnector()).toBe(dataConnector);
    expect(synclet.getMetaConnector()).toBe(metaConnector);
    expect(synclet.getTransport()).toEqual([]);

    await synclet.start();
    await synclet.stop();
    await synclet.destroy();
  });

  test('no connectors, multiple transports', async () => {
    const transport1 = createMockTransport();
    const transport2 = createMemoryTransport();

    const synclet = await createSynclet({
      transport: [transport1, transport2],
    });

    expect(synclet).toBeDefined();
    expect(synclet.getDataConnector()).toBeUndefined();
    expect(synclet.getMetaConnector()).toBeUndefined();
    expect(synclet.getTransport()).toHaveLength(2);
    expect(synclet.getTransport()).toContain(transport1);
    expect(synclet.getTransport()).toContain(transport2);

    await synclet.start();
    await synclet.stop();
    await synclet.destroy();
  });
});

test('log', async () => {
  const logger = {info: vi.fn()};
  const synclet = await createSynclet(
    {dataConnector, metaConnector, transport},
    {},
    {id: 'synclet', logger},
  );
  await synclet.start();
  expect(logger.info).toHaveBeenCalledWith('[synclet] start');
  expect(logger.info).toHaveBeenCalledWith('[synclet] sync (0) ');
  await synclet.stop();
  expect(logger.info).toHaveBeenCalledWith('[synclet] stop');
  await synclet.destroy();
  expect(logger.info).toHaveBeenCalledWith('[synclet] destroy');
});

test('error on reassigning transport', async () => {
  const synclet = await createSynclet({
    dataConnector,
    metaConnector,
    transport,
  });
  await expect(async () => {
    await createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector: createMockMetaConnector(1),
      transport,
    });
  }).rejects.toThrow('Transport is already attached to Synclet');

  await synclet.destroy();
});

test('error on reassigning data connector', async () => {
  const synclet = await createSynclet({
    dataConnector,
    metaConnector,
    transport,
  });
  await expect(async () => {
    await createSynclet({
      dataConnector,
      metaConnector: createMockMetaConnector(1),
      transport: createMockTransport(),
    });
  }).rejects.toThrow('Data connector is already attached to Synclet');

  await synclet.destroy();
});

test('error on reassigning meta connector', async () => {
  const synclet = await createSynclet({
    dataConnector,
    metaConnector,
    transport,
  });
  await expect(() =>
    createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector,
      transport: createMockTransport(),
    }),
  ).rejects.toThrow('Meta connector is already attached to Synclet');

  await synclet.destroy();
});

test('start & stop', async () => {
  const synclet = await createSynclet({
    dataConnector,
    metaConnector,
    transport,
  });
  expect(synclet.isStarted()).toEqual(false);

  await synclet.start();
  expect(synclet.isStarted()).toEqual(true);

  await synclet.stop();
  expect(synclet.isStarted()).toEqual(false);

  await synclet.destroy();
});

describe('context', () => {
  test('send message', async () => {
    const canReceiveMessage = vi.fn();

    const synclet1 = await createSynclet({
      dataConnector: createMockDataConnector(1),
      metaConnector: createMockMetaConnector(1),
      transport: createMemoryTransport({poolId: 'pool1'}),
    });
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(canReceiveMessage).toHaveBeenCalledWith({});

    await synclet1.destroy();
    await synclet2.destroy();
  });

  test('add context', async () => {
    const getSendContext = vi.fn(async () => ({foo: 42}));
    const canReceiveMessage = vi.fn();

    const synclet1 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {getSendContext},
    );
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector(1),
        metaConnector: createMockMetaConnector(1),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {canReceiveMessage},
    );
    await synclet2.start();
    await synclet1.start();

    expect(getSendContext).toHaveBeenCalledWith({});
    expect(canReceiveMessage).toHaveBeenCalledWith({foo: 42});

    await synclet1.destroy();
    await synclet2.destroy();
  });
});
