import {Atom, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {createBaseTableConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestTableConnector = (options?: ConnectorOptions) => {
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

  const getTable = () => table;

  return {
    ...connector,
    getTable,
  };
};

describe('table sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getTable()).toEqual(connector2.getTable());
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});

    await connector2.setCell('r1', 'c1', 'C2');
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector1.getTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({});

    await synclet2.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet2.start();
    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({});

    await synclet1.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector1.setCell('r1', 'c1', 'C2');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector2.setCell('r1', 'c1', 'C2');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});

    await synclet1.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await connector1.setCell('r1', 'c1', 'C1');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({});

    await connector2.setCell('r1', 'c1', 'C2');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C2'}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
  });
  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r2', 'c2', 'C2');
    expect(connector1.getTable()).toEqual({
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
    expect(connector2.getTable()).toEqual({
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });
  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
    expect(connector2.getTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
  });
  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTable()).toEqual({
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
    expect(connector2.getTable()).toEqual({
      r1: {c1: 'C1'},
      r2: {c2: 'C2'},
    });
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setCell('r1', 'c1', 'C1');
    await connector2.setCell('r1', 'c2', 'C2');
    await connector1.setCell('r1', 'c2', 'C3');
    await connector2.setCell('r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getTable()).toEqual({
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
    expect(connector2.getTable()).toEqual({
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
  });
});
