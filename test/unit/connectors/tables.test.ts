import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseTablesConnector,
  createBaseTablesConnector,
} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

type TestTablesConnector = BaseTablesConnector & {
  setCellForTest: (
    tableId: string,
    rowId: string,
    cellId: string,
    atom: Atom,
  ) => Promise<void>;
  delCellForTest: (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => Promise<void>;
  getTablesForTest: () => {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  };
  getTimestampsForTest: () => {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}};
  };
  getRowHashesForTest: () => {[tableId: string]: {[rowId: string]: Hash}};
  getTableHashesForTest: () => {[tableId: string]: Hash};
  getTablesHashForTest: () => Hash | undefined;
};

const createTestTablesConnector = (
  options?: ConnectorOptions,
): TestTablesConnector => {
  const tables: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  } = {};
  const timestamps: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}};
  } = {};
  const rowHashes: {[tableId: string]: {[rowId: string]: Hash}} = {};
  const tableHashes: {[tableId: string]: Hash} = {};
  let tablesHash: Hash | undefined;

  const connector = createBaseTablesConnector(
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

    getTablesForTest: () => tables,

    getTimestampsForTest: () => timestamps,

    getRowHashesForTest: () => rowHashes,

    getTableHashesForTest: () => tableHashes,

    getTablesHashForTest: () => tablesHash,
  };
};

const expectEquivalentConnectors = (
  connector1: TestTablesConnector,
  connector2: TestTablesConnector,
  tables: {[tableId: string]: {[rowId: string]: {[cellId: string]: Atom}}} = {},
) => {
  expect(connector1.getTablesForTest()).toEqual(tables);
  expect(connector2.getTablesForTest()).toEqual(tables);
  expect(connector1.getTimestampsForTest()).toEqual(
    connector2.getTimestampsForTest(),
  );

  expect(connector1.getRowHashesForTest()).toEqual(
    connector2.getRowHashesForTest(),
  );
  expect(connector1.getTableHashesForTest()).toEqual(
    connector2.getTableHashesForTest(),
  );
  expect(connector1.getTablesHashForTest()).toEqual(
    connector2.getTablesHashForTest(),
  );
};

const expectDifferingConnectors = (
  connector1: TestTablesConnector,
  connector2: TestTablesConnector,
  tables1: {[tableId: string]: {[rowId: string]: {[cellId: string]: Atom}}},
  tables2: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  } = {},
) => {
  expect(connector1.getTablesForTest()).toEqual(tables1);
  expect(connector2.getTablesForTest()).toEqual(tables2);
  expect(connector1.getTimestampsForTest()).not.toEqual(
    connector2.getTimestampsForTest(),
  );
  expect(connector1.getRowHashesForTest()).not.toEqual(
    connector2.getRowHashesForTest(),
  );
  expect(connector1.getTableHashesForTest()).not.toEqual(
    connector2.getTableHashesForTest(),
  );
  expect(connector1.getTablesHashForTest()).not.toEqual(
    connector2.getTablesHashForTest(),
  );
};

describe('tables sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors(connector1, connector2);
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C2'}}});
  });

  test('connected, deletion', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    const timestamp = connector1.getTimestampsForTest().t1.r1.c1;
    await connector1.delCellForTest('t1', 'r1', 'c1');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {}}});
    expect(timestamp).not.toEqual(connector1.getTimestampsForTest().t1.r1.c1);
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet2.start();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C2'}}},
      {t1: {r1: {c1: 'C1'}}},
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C2'}}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {t1: {r1: {c1: 'C2'}}},
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C2'}}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {t1: {r1: {c1: 'C1'}}});

    await connector2.setCellForTest('t1', 'r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {t1: {r1: {c1: 'C1'}}},
      {t1: {r1: {c1: 'C2'}}},
    );

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {t1: {r1: {c1: 'C2'}}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    expectEquivalentConnectors(connector1, connector2, {
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t2', 'r2', 'c2', 'C2');
    expectEquivalentConnectors(connector1, connector2, {
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t2', 'r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCellForTest('t1', 'r1', 'c1', 'C1');
    await connector2.setCellForTest('t1', 'r1', 'c2', 'C2');
    await connector1.setCellForTest('t1', 'r1', 'c2', 'C3');
    await connector2.setCellForTest('t1', 'r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
  });
});
