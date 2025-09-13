import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseTableConnector,
  createBaseTableConnector,
} from 'synclets/connector/base';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestTableConnector extends BaseTableConnector {
  getDataForTest(): {[rowId: string]: {[cellId: string]: Atom}};
  getMetaForTest(): [
    {[rowId: string]: {[cellId: string]: Timestamp}},
    Hash | undefined,
    {[rowId: string]: Hash},
  ];
}

const createTestTableConnector = async (
  options?: ConnectorOptions,
): Promise<TestTableConnector> => {
  const table: {[rowId: string]: {[cellId: string]: Atom}} = {};
  const timestamps: {[rowId: string]: {[cellId: string]: Timestamp}} = {};
  const rowHashes: {[rowId: string]: Hash} = {};
  let tableHash: Hash | undefined;

  const connector = await createBaseTableConnector(
    {
      readTableHash: async () => tableHash,

      readRowIds: async () => Object.keys(table),

      readRowHash: async (rowId: string) => rowHashes[rowId],

      readCellIds: async (rowId: string) => Object.keys(table[rowId] ?? {}),

      readCellAtom: async (rowId: string, cellId: string) =>
        table[rowId]?.[cellId],

      readCellTimestamp: async (rowId: string, cellId: string) =>
        timestamps[rowId]?.[cellId],

      writeTableHash: async (hash: Hash) => {
        tableHash = hash;
      },

      writeRowHash: async (rowId: string, hash: Hash) => {
        rowHashes[rowId] = hash;
      },

      writeCellAtom: async (rowId: string, cellId: string, atom: Atom) => {
        table[rowId] = table[rowId] || {};
        table[rowId][cellId] = atom;
      },

      writeCellTimestamp: async (
        rowId: string,
        cellId: string,
        timestamp: Timestamp,
      ) => {
        timestamps[rowId] = timestamps[rowId] || {};
        timestamps[rowId][cellId] = timestamp;
      },

      removeCellAtom: async (rowId: string, cellId: string) => {
        delete table[rowId]?.[cellId];
      },
    },
    options,
  );

  return {
    ...connector,

    getDataForTest: () => table,

    getMetaForTest: () => [timestamps, tableHash, rowHashes],
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTableConnector, 2);

    expectEquivalentConnectors([connector1, connector2], {});
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTableConnector, 2);

    await connector1.setCell('r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});

    await connector2.setCell('r1', 'c1', 'C2');
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C2'}});
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTableConnector, 2);

    await connector1.setCell('r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});

    const timestamp = connector1.getMetaForTest()[0].r1.c1;
    await connector1.delCell('r1', 'c1');
    expectEquivalentConnectors([connector1, connector2], {r1: {}});
    expect(timestamp).not.toEqual(connector1.getMetaForTest()[0].r1.c1);
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );

    await synclet1.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}}, {});

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );

    await synclet2.start();
    await connector1.connect();
    await connector1.setCell('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}}, {});

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector1.connect();
    await connector1.setCell('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C2'}},
      {r1: {c1: 'C1'}},
    );

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C2'}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector2.setCell('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C1'}},
      {r1: {c1: 'C2'}},
    );

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C2'}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector1.setCell('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}}, {});

    await pause();

    await connector2.connect();
    await connector2.setCell('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C1'}},
      {r1: {c1: 'C2'}},
    );

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {r1: {c1: 'C2'}});
  });

  test('connected, different values 1', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    expectEquivalentConnectors([connector1, connector2], {
      r1: {c1: 'C1', c2: 'C2'},
    });
  });

  test('connected, different values 2', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r2', 'c2', 'C2');
    expectEquivalentConnectors([connector1, connector2], {
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      r1: {c1: 'C1', c2: 'C2'},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTableConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    await pause();
    await connector1.setCell('r1', 'c2', 'C3');
    await connector2.setCell('r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestTableConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setCell('r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {r: {c: 'C' + i}});
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestTableConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setCell('r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {r: {c: 'C' + i}});
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestTableConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setCell('r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {r: {c: 'C' + i}});
    }
  });
});
