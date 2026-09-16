import {
  createSynclet,
  createTransport,
  type DataConnector,
  type MetaConnector,
  type Transport,
} from 'synclets';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
  createMemoryTransport,
} from 'synclets/memory';
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
  dataConnector = createMockDataConnector({depth: 1});
  metaConnector = createMockMetaConnector({depth: 1});
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
        dataConnector: createMockDataConnector({depth: 1}),
      }),
    ).rejects.toThrow('both connectors must be provided, or both omitted');
  });

  test('error when only metaConnector provided', async () => {
    await expect(
      createSynclet({
        metaConnector: createMockMetaConnector({depth: 1}),
      }),
    ).rejects.toThrow('both connectors must be provided, or both omitted');
  });

  test('error when connectors have different depths', async () => {
    await expect(
      createSynclet({
        dataConnector: createMockDataConnector({depth: 2}),
        // @ts-expect-error Testing invalid input
        metaConnector: createMockMetaConnector({depth: 3}),
      }),
    ).rejects.toThrow('depths must be positive and equal; 2 vs 3');
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
    const dataConnector = createMockDataConnector({depth: 1});
    const metaConnector = createMockMetaConnector({depth: 1});
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
    const dataConnector = createMockDataConnector({depth: 1});
    const metaConnector = createMockMetaConnector({depth: 1});

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
      dataConnector: createMockDataConnector({depth: 1}),
      metaConnector: createMockMetaConnector({depth: 1}),
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
      metaConnector: createMockMetaConnector({depth: 1 as const}),
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
      dataConnector: createMockDataConnector({depth: 1}),
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

describe('fragmentation', () => {
  test('does not split code points across fragments', async () => {
    const packets: string[] = [];
    const synclet = await createSynclet({
      dataConnector: createMemoryDataConnector({depth: 1}),
      metaConnector: createMemoryMetaConnector({depth: 1}),
      transport: createTransport(
        {
          sendPacket: async (packet) => {
            packets.push(packet);
          },
        },
        {fragmentSize: 7},
      ),
    });
    await synclet.start();
    await synclet.setAtom(['😀😀😀😀'], 1);

    expect(packets.length).toBeGreaterThan(1);
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    packets.forEach((packet) =>
      // A fragment that ends half way through a surrogate pair loses that
      // character, because each fragment is encoded on its own.
      expect(decoder.decode(encoder.encode(packet))).toEqual(packet),
    );

    await synclet.destroy();
  });
});

describe('fragment bounds', () => {
  const createReceivingSynclet = async (warn: (string: string) => void) => {
    let receivePacket: ((packet: string) => Promise<void>) | undefined;
    const synclet = await createSynclet(
      {
        dataConnector,
        metaConnector,
        transport: createTransport({
          attach: async (receive) => {
            receivePacket = receive;
          },
          sendPacket: async () => {},
        }),
      },
      {},
      {id: 'synclet', logger: {warn}},
    );
    await synclet.start();
    return [synclet, receivePacket!] as const;
  };

  test('drops a fragment indexed beyond its total', async () => {
    const warn = vi.fn();
    const [synclet, receivePacket] = await createReceivingSynclet(warn);

    // Packets are '<from> <messageId> <index> <total> <fragment>'.
    await receivePacket('peer message1 5 2 fragment');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid fragment 5/2'),
    );

    await synclet.destroy();
  });

  test('drops a fragment claiming an implausible total', async () => {
    const warn = vi.fn();
    const [synclet, receivePacket] = await createReceivingSynclet(warn);

    await receivePacket('peer message1 0 100000 fragment');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid fragment 0/100000'),
    );

    await synclet.destroy();
  });

  test('drops a fragment that contradicts an earlier total', async () => {
    const warn = vi.fn();
    const [synclet, receivePacket] = await createReceivingSynclet(warn);

    await receivePacket('peer message1 0 3 fragment');
    await receivePacket('peer message1 1 2 fragment');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid fragment total 2'),
    );

    await synclet.destroy();
  });

  test('stops buffering once too many messages are incomplete', async () => {
    const warn = vi.fn();
    const [synclet, receivePacket] = await createReceivingSynclet(warn);

    // Each of these starts a two-fragment message that never completes.
    for (let message = 0; message <= 100; message++) {
      await receivePacket(`peer message${message} 0 2 fragment`);
    }

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid fragment buffer overflow'),
    );

    await synclet.destroy();
  });
});

describe('context', () => {
  test('send message', async () => {
    const canReceiveMessage = vi.fn();

    const synclet1 = await createSynclet({
      dataConnector: createMockDataConnector({depth: 1}),
      metaConnector: createMockMetaConnector({depth: 1}),
      transport: createMemoryTransport({poolId: 'pool1'}),
    });
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector({depth: 1}),
        metaConnector: createMockMetaConnector({depth: 1}),
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
        dataConnector: createMockDataConnector({depth: 1}),
        metaConnector: createMockMetaConnector({depth: 1}),
        transport: createMemoryTransport({poolId: 'pool1'}),
      },
      {getSendContext},
    );
    const synclet2 = await createSynclet(
      {
        dataConnector: createMockDataConnector({depth: 1}),
        metaConnector: createMockMetaConnector({depth: 1}),
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
