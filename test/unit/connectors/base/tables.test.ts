import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseTablesConnector,
  createBaseTablesConnector,
} from 'synclets/connector/base';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestTablesConnector extends BaseTablesConnector {
  setCellForTest(
    tableId: string,
    rowId: string,
    cellId: string,
    atom: Atom,
  ): Promise<void>;
  delCellForTest(tableId: string, rowId: string, cellId: string): Promise<void>;
  getDataForTest(): {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  };
  getMetaForTest(): [
    {[tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}}},
    Hash | undefined,
    {[tableId: string]: Hash},
    {[tableId: string]: {[rowId: string]: Hash}},
  ];
}

const createTestTablesConnector = async (
  options?: ConnectorOptions,
): Promise<TestTablesConnector> => {
  const tables: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  } = {};
  const timestamps: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}};
  } = {};
  const rowHashes: {[tableId: string]: {[rowId: string]: Hash}} = {};
  const tableHashes: {[tableId: string]: Hash} = {};
  let tablesHash: Hash | undefined;

  const connector = await createBaseTablesConnector(
    {
      readTablesHash: async () => tablesHash,

      readTableIds: async () => Object.keys(tables),

      readTableHash: async (tableId: string) => tableHashes[tableId],

      readRowIds: async (tableId: string) => Object.keys(tables[tableId] ?? {}),

      readRowHash: async (tableId: string, rowId: string) =>
        rowHashes[tableId]?.[rowId],

      readCellIds: async (tableId: string, rowId: string) =>
        Object.keys(tables[tableId]?.[rowId] ?? {}),

      readCellAtom: async (tableId: string, rowId: string, cellId: string) =>
        tables[tableId]?.[rowId]?.[cellId],

      readCellTimestamp: async (
        tableId: string,
        rowId: string,
        cellId: string,
      ) => timestamps[tableId]?.[rowId]?.[cellId],

      writeTablesHash: async (hash: Hash) => {
        tablesHash = hash;
      },

      writeTableHash: async (tableId: string, hash: Hash) => {
        tableHashes[tableId] = hash;
      },

      writeRowHash: async (tableId: string, rowId: string, hash: Hash) => {
        rowHashes[tableId] = rowHashes[tableId] || {};
        rowHashes[tableId][rowId] = hash;
      },

      writeCellAtom: async (
        tableId: string,
        rowId: string,
        cellId: string,
        atom: Atom,
      ) => {
        tables[tableId] = tables[tableId] || {};
        tables[tableId][rowId] = tables[tableId][rowId] || {};
        tables[tableId][rowId][cellId] = atom;
      },

      writeCellTimestamp: async (
        tableId: string,
        rowId: string,
        cellId: string,
        timestamp: Timestamp,
      ) => {
        timestamps[tableId] = timestamps[tableId] || {};
        timestamps[tableId][rowId] = timestamps[tableId][rowId] || {};
        timestamps[tableId][rowId][cellId] = timestamp;
      },

      removeCellAtom: async (
        tableId: string,
        rowId: string,
        cellId: string,
      ) => {
        delete tables[tableId]?.[rowId]?.[cellId];
      },
    },
    options,
  );

  return {
    ...connector,

    setCellForTest: (
      tableId: string,
      rowId: string,
      cellId: string,
      cell: Atom,
    ) => connector.setCell(tableId, rowId, cellId, cell),

    delCellForTest: (tableId: string, rowId: string, cellId: string) =>
      connector.delCell(tableId, rowId, cellId),

    getDataForTest: () => tables,

    getMetaForTest: () => [timestamps, tablesHash, tableHashes, rowHashes],
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTablesConnector, 2);

    expectEquivalentConnectors([connector1, connector2], {});
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });

    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C2'}},
    });
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });

    const timestamp = connector1.getMetaForTest()[0].t1.r1.c1;
    await connector1.delCellForTest('t1', 'r1', 'c1');
    expectEquivalentConnectors([connector1, connector2], {t1: {r1: {}}});
    expect(timestamp).not.toEqual(connector1.getMetaForTest()[0].t1.r1.c1);
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );

    await synclet1.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {},
    );

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );

    await synclet2.start();
    await connector1.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {},
    );

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });

    await synclet1.stop();
    await connector1.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C2'}}},
      {t1: {r1: {c1: 'C1'}}},
    );

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C2'}},
    });
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
    });

    await synclet1.stop();
    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {t1: {r1: {c1: 'C2'}}},
    );

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C2'}},
    });
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {},
    );

    await pause();

    await connector2.connect();
    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {t1: {r1: {c1: 'C2'}}},
    );

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C2'}},
    });
  });

  test('connected, different values 1', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });

  test('connected, different values 2', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t2', 'r2', 'c2', 'C2');
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t2', 'r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestTablesConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    await pause();
    await connector1.setCellForTest('t1', 'r1', 'c2', 'C3');
    await connector2.setCellForTest('t1', 'r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestTablesConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setCellForTest('t', 'r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {t: {r: {c: 'C' + i}}});
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestTablesConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setCellForTest('t', 'r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {t: {r: {c: 'C' + i}}});
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestTablesConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setCellForTest('t', 'r', 'c', 'C' + i);
      expectEquivalentConnectors(connectors, {t: {r: {c: 'C' + i}}});
    }
  });
});
