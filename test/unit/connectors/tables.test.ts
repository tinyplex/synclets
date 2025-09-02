import {ConnectorOptions, Hash, Timestamp, Value} from 'synclets';
import {createBaseTablesConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestTablesConnector = (options?: ConnectorOptions) => {
  const underlyingTables: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Value}};
  } = {};
  const underlyingTimestamps: {
    [tableId: string]: {[rowId: string]: {[cellId: string]: Timestamp}};
  } = {};
  const underlyingTableHashes: {[tableId: string]: Hash} = {};
  const underlyingRowHashes: {[tableId: string]: {[rowId: string]: Hash}} = {};
  let underlyingTablesHash: Hash = 0;

  const getUnderlyingTablesHash = async () => underlyingTablesHash;

  const getUnderlyingTableIds = async () => Object.keys(underlyingTables);

  const getUnderlyingTableHash = async (tableId: string) =>
    underlyingTableHashes[tableId];

  const getUnderlyingRowIds = async (tableId: string) =>
    Object.keys(underlyingTables[tableId] ?? {});

  const getUnderlyingRowHash = async (tableId: string, rowId: string) =>
    underlyingRowHashes[tableId]?.[rowId];

  const getUnderlyingCellIds = async (tableId: string, rowId: string) =>
    Object.keys(underlyingTables[tableId]?.[rowId] ?? {});

  const getUnderlyingCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => underlyingTables[tableId]?.[rowId]?.[cellId];

  const getUnderlyingCellTimestamp = async (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => underlyingTimestamps[tableId]?.[rowId]?.[cellId];

  const setUnderlyingTablesHash = async (hash: Hash) => {
    underlyingTablesHash = hash;
  };

  const setUnderlyingTableHash = async (tableId: string, hash: Hash) => {
    underlyingTableHashes[tableId] = hash;
  };

  const setUnderlyingRowHash = async (
    tableId: string,
    rowId: string,
    hash: Hash,
  ) => {
    underlyingRowHashes[tableId] = underlyingRowHashes[tableId] || {};
    underlyingRowHashes[tableId][rowId] = hash;
  };

  const setUnderlyingCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
    cell: Value,
  ) => {
    underlyingTables[tableId] = underlyingTables[tableId] || {};
    underlyingTables[tableId][rowId] = underlyingTables[tableId][rowId] || {};
    underlyingTables[tableId][rowId][cellId] = cell;
  };

  const setUnderlyingCellTimestamp = async (
    tableId: string,
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => {
    underlyingTimestamps[tableId] = underlyingTimestamps[tableId] || {};
    underlyingTimestamps[tableId][rowId] =
      underlyingTimestamps[tableId][rowId] || {};
    underlyingTimestamps[tableId][rowId][cellId] = timestamp;
  };

  const getTables = () => underlyingTables;

  const connector = createBaseTablesConnector(
    {
      getUnderlyingTablesHash,
      getUnderlyingTableIds,
      getUnderlyingTableHash,
      getUnderlyingRowIds,
      getUnderlyingRowHash,
      getUnderlyingCellIds,
      getUnderlyingCell,
      getUnderlyingCellTimestamp,
      setUnderlyingTablesHash,
      setUnderlyingTableHash,
      setUnderlyingRowHash,
      setUnderlyingCell,
      setUnderlyingCellTimestamp,
    },
    options,
  );

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
