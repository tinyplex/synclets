import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {createBaseTablesConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestTablesConnector = (options?: ConnectorOptions) => {
  const tables: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Atom}};
  } = {};
  const timestamps: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}};
  } = {};
  const tableHashes: {[tableId: string]: Hash} = {};
  const rowHashes: {[tableId: string]: {[rowId: string]: Hash}} = {};
  let tablesHash: Hash = 0;

  const connector = createBaseTablesConnector(
    {
      getTablesHash: async () => tablesHash,

      getTableIds: async () => Object.keys(tables),

      getTableHash: async (tableId: string) => tableHashes[tableId],

      getRowIds: async (tableId: string) => Object.keys(tables[tableId] ?? {}),

      getRowHash: async (tableId: string, rowId: string) =>
        rowHashes[tableId]?.[rowId],

      getCellIds: async (tableId: string, rowId: string) =>
        Object.keys(tables[tableId]?.[rowId] ?? {}),

      getCellAtom: async (tableId: string, rowId: string, cellId: string) =>
        tables[tableId]?.[rowId]?.[cellId],

      getCellTimestamp: async (
        tableId: string,
        rowId: string,
        cellId: string,
      ) => timestamps[tableId]?.[rowId]?.[cellId],

      setTablesHash: async (hash: Hash) => {
        tablesHash = hash;
      },

      setTableHash: async (tableId: string, hash: Hash) => {
        tableHashes[tableId] = hash;
      },

      setRowHash: async (tableId: string, rowId: string, hash: Hash) => {
        rowHashes[tableId] = rowHashes[tableId] || {};
        rowHashes[tableId][rowId] = hash;
      },

      setCellAtom: async (
        tableId: string,
        rowId: string,
        cellId: string,
        atom: Atom,
      ) => {
        tables[tableId] = tables[tableId] || {};
        tables[tableId][rowId] = tables[tableId][rowId] || {};
        tables[tableId][rowId][cellId] = atom;
      },

      setCellTimestamp: async (
        tableId: string,
        rowId: string,
        cellId: string,
        timestamp: Timestamp,
      ) => {
        timestamps[tableId] = timestamps[tableId] || {};
        timestamps[tableId][rowId] = timestamps[tableId][rowId] || {};
        timestamps[tableId][rowId][cellId] = timestamp;
      },
    },
    options,
  );

  const getTables = () => tables;

  return {
    ...connector,
    getTables,
  };
};

describe('table sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getTables()).toEqual(connector2.getTables());
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await connector2.setCell('t1', 'r1', 'c1', 'C2');
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();

    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({});

    await synclet2.start();
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet2.start();
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({});

    await synclet1.start();
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector1.setCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.start();
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector2.setCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});

    await synclet1.start();
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({});

    await connector2.setCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    await connector2.setCell('t1', 'r1', 'c2', 'C2');
    expect(connector1.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
    expect(connector2.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    await connector2.setCell('t2', 'r2', 'c2', 'C2');
    expect(connector1.getTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
    expect(connector2.getTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    await connector2.setCell('t1', 'r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
    expect(connector2.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    await connector2.setCell('t2', 'r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
    expect(connector2.getTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setCell('t1', 'r1', 'c1', 'C1');
    await connector2.setCell('t1', 'r1', 'c2', 'C2');
    await connector1.setCell('t1', 'r1', 'c2', 'C3');
    await connector2.setCell('t1', 'r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
    expect(connector2.getTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
  });
});
