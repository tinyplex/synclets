import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {
  BaseTableConnector,
  createBaseTableConnector,
} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

type TestTableConnector = BaseTableConnector & {
  setCellForTest: (rowId: string, cellId: string, cell: Atom) => Promise<void>;
  getTableForTest: () => {[rowId: string]: {[cellId: string]: Atom}};
  getTimestampsForTest: () => {[rowId: string]: {[cellId: string]: Timestamp}};
  getTableHashForTest: () => Hash;
  getRowHashesForTest: () => {[rowId: string]: Hash};
};

const createTestTableConnector = (
  options?: ConnectorOptions,
): TestTableConnector => {
  const table: {[rowId: string]: {[cellId: string]: Atom}} = {};
  const timestamps: {[rowId: string]: {[cellId: string]: Timestamp}} = {};
  const rowHashes: {[rowId: string]: Hash} = {};
  let tableHash: Hash = 0;

  const connector = createBaseTableConnector(
    {
      getTableHash: async () => tableHash,

      getRowIds: async () => Object.keys(table),

      getRowHash: async (rowId: string) => rowHashes[rowId],

      getCellIds: async (rowId: string) => Object.keys(table[rowId] ?? {}),

      getCellAtom: async (rowId: string, cellId: string) =>
        table[rowId]?.[cellId],

      getCellTimestamp: async (rowId: string, cellId: string) =>
        timestamps[rowId]?.[cellId],

      setTableHash: async (hash: Hash) => {
        tableHash = hash;
      },

      setRowHash: async (rowId: string, hash: Hash) => {
        rowHashes[rowId] = hash;
      },

      setCellAtom: async (rowId: string, cellId: string, atom: Atom) => {
        table[rowId] = table[rowId] || {};
        table[rowId][cellId] = atom;
      },

      setCellTimestamp: async (
        rowId: string,
        cellId: string,
        timestamp: Timestamp,
      ) => {
        timestamps[rowId] = timestamps[rowId] || {};
        timestamps[rowId][cellId] = timestamp;
      },
    },
    options,
  );

  return {
    ...connector,
    setCellForTest: (rowId: string, cellId: string, cell: Atom) =>
      connector.setManagedCell(rowId, cellId, cell, {}),
    getTableForTest: () => table,
    getTimestampsForTest: () => timestamps,
    getRowHashesForTest: () => rowHashes,
    getTableHashForTest: () => tableHash,
  };
};

const expectEquivalentConnectors = (
  connector1: TestTableConnector,
  connector2: TestTableConnector,
  table: {[rowId: string]: {[cellId: string]: Atom}} = {},
) => {
  expect(connector1.getTableForTest()).toEqual(table);
  expect(connector2.getTableForTest()).toEqual(table);
  expect(connector1.getTimestampsForTest()).toEqual(
    connector2.getTimestampsForTest(),
  );
  expect(connector1.getRowHashesForTest()).toEqual(
    connector2.getRowHashesForTest(),
  );
  expect(connector1.getTableHashForTest()).toEqual(
    connector2.getTableHashForTest(),
  );
};

const expectDifferingConnectors = (
  connector1: TestTableConnector,
  connector2: TestTableConnector,
  table1: {[rowId: string]: {[cellId: string]: Atom}},
  table2: {[rowId: string]: {[cellId: string]: Atom}} = {},
) => {
  expect(connector1.getTableForTest()).toEqual(table1);
  expect(connector2.getTableForTest()).toEqual(table2);
  expect(connector1.getTimestampsForTest()).not.toEqual(
    connector2.getTimestampsForTest(),
  );
  expect(connector1.getRowHashesForTest()).not.toEqual(
    connector2.getRowHashesForTest(),
  );
  expect(connector1.getTableHashForTest()).not.toEqual(
    connector2.getTableHashForTest(),
  );
};

describe('table sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors(connector1, connector2);
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await connector2.setCellForTest('r1', 'c1', 'C2');
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C2'}});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();

    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C1'}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet2.start();
    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C1'}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector1.setCellForTest('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C2'}},
      {r1: {c1: 'C1'}},
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C2'}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector2.setCellForTest('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C1'}},
      {r1: {c1: 'C2'}},
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C2'}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await connector1.setCellForTest('r1', 'c1', 'C1');
    expectDifferingConnectors(connector1, connector2, {r1: {c1: 'C1'}});

    await connector2.setCellForTest('r1', 'c1', 'C2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {r1: {c1: 'C1'}},
      {r1: {c1: 'C2'}},
    );

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {r1: {c1: 'C2'}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCellForTest('r1', 'c1', 'C1');
    await connector2.setCellForTest('r1', 'c2', 'C2');
    expectEquivalentConnectors(connector1, connector2, {
      r1: {c1: 'C1', c2: 'C2'},
    });
  });
  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCellForTest('r1', 'c1', 'C1');
    await connector2.setCellForTest('r2', 'c2', 'C2');
    expectEquivalentConnectors(connector1, connector2, {
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });
  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCellForTest('r1', 'c1', 'C1');
    await connector2.setCellForTest('r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      r1: {c1: 'C1', c2: 'C2'},
    });
  });
  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCellForTest('r1', 'c1', 'C1');
    await connector2.setCellForTest('r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCellForTest('r1', 'c1', 'C1');
    await connector2.setCellForTest('r1', 'c2', 'C2');
    await connector1.setCellForTest('r1', 'c2', 'C3');
    await connector2.setCellForTest('r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
  });
});
