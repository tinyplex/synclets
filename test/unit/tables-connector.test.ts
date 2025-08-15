import {ConnectorOptions, Hash, Timestamp, Value} from 'synclets';
import {createTablesConnector} from 'synclets/connector/tables';
import {getHash} from 'synclets/utils';
import {getTestSyncletsAndConnectors} from './common.ts';

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
  let underlyingSync:
    | ((tableId?: string, rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connect = async (
    sync: (tableId?: string, rowId?: string, cellId?: string) => Promise<void>,
  ) => {
    underlyingSync = sync;
  };

  const getTablesHash = async () => underlyingTablesHash;

  const getTableIds = async () => Object.keys(underlyingTables);

  const getTableHash = async (tableId: string) => {
    return underlyingTableHashes[tableId] ?? 0;
  };

  const getRowIds = async (tableId: string) =>
    Object.keys(underlyingTables[tableId] ?? {});

  const getRowHash = async (tableId: string, rowId: string) => {
    return underlyingRowHashes[tableId]?.[rowId] ?? 0;
  };

  const getCellIds = async (tableId: string, rowId: string) => {
    return Object.keys(underlyingTables[tableId]?.[rowId] ?? {});
  };

  const getCell = async (tableId: string, rowId: string, cellId: string) => {
    return underlyingTables[tableId]?.[rowId]?.[cellId];
  };

  const getCellTimestamp = async (
    tableId: string,
    rowId: string,
    cellId: string,
  ) => {
    return underlyingTimestamps[tableId]?.[rowId]?.[cellId] ?? '';
  };

  const setTablesHash = async (hash: Hash) => {
    underlyingTablesHash = hash;
  };

  const setTableHash = async (tableId: string, hash: Hash) => {
    underlyingTableHashes[tableId] = hash;
  };

  const setRowHash = async (tableId: string, rowId: string, hash: Hash) => {
    underlyingRowHashes[tableId] = underlyingRowHashes[tableId] || {};
    underlyingRowHashes[tableId][rowId] = hash;
  };

  const setCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
    value: Value,
  ) => {
    underlyingTables[tableId] = underlyingTables[tableId] || {};
    underlyingTables[tableId][rowId] = underlyingTables[tableId][rowId] || {};
    underlyingTables[tableId][rowId][cellId] = value;
  };

  const setCellTimestamp = async (
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

  const getUnderlyingTables = () => underlyingTables;

  const setUnderlyingCell = async (
    tableId: string,
    rowId: string,
    cellId: string,
    value: Value,
  ) => {
    const timestamp = connector.getNextTimestamp();

    underlyingTables[tableId] = underlyingTables[tableId] || {};
    underlyingTables[tableId][rowId] = underlyingTables[tableId][rowId] || {};
    underlyingTables[tableId][rowId][cellId] = value;

    underlyingTimestamps[tableId] = underlyingTimestamps[tableId] || {};
    underlyingTimestamps[tableId][rowId] =
      underlyingTimestamps[tableId][rowId] || {};
    underlyingTimestamps[tableId][rowId][cellId] = timestamp;

    underlyingRowHashes[tableId] = underlyingRowHashes[tableId] || {};
    underlyingRowHashes[tableId][rowId] =
      (underlyingRowHashes[tableId][rowId] ^ getHash(timestamp)) >>> 0;
    underlyingTableHashes[tableId] =
      (underlyingTableHashes[tableId] ^ underlyingRowHashes[tableId][rowId]) >>>
      0;
    underlyingTablesHash =
      (underlyingTablesHash ^ underlyingTableHashes[tableId]) >>> 0;
    await underlyingSync?.(tableId, rowId, cellId);
  };

  const connector = createTablesConnector(
    {
      connect,
      getTablesHash,
      getTableIds,
      getTableHash,
      getRowIds,
      getRowHash,
      getCellIds,
      getCell,
      getCellTimestamp,
      setTablesHash,
      setTableHash,
      setRowHash,
      setCell,
      setCellTimestamp,
    },
    options,
  );
  return {
    ...connector,
    getUnderlyingTables,
    setUnderlyingCell,
  };
};

describe('table sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingTables()).toEqual(
      connector2.getUnderlyingTables(),
    );
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await connector2.setUnderlyingCell('t1', 'r1', 'c1', 'C2');
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();

    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({});

    await synclet2.start();
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet2.start();
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({});

    await synclet1.start();
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.start();
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});

    await synclet1.stop();
    await connector2.setUnderlyingCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});

    await synclet1.start();
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);

    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({});

    await connector2.setUnderlyingCell('t1', 'r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C1'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
    expect(connector2.getUnderlyingTables()).toEqual({t1: {r1: {c1: 'C2'}}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('t1', 'r1', 'c2', 'C2');
    expect(connector1.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
    expect(connector2.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('t2', 'r2', 'c2', 'C2');
    expect(connector1.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
    expect(connector2.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('t1', 'r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
    expect(connector2.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C2'}},
    });
  });
  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('t2', 'r2', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
    expect(connector2.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1'}},
      t2: {r2: {c2: 'C2'}},
    });
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTablesConnector, 2);
    await connector1.setUnderlyingCell('t1', 'r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('t1', 'r1', 'c2', 'C2');
    await connector1.setUnderlyingCell('t1', 'r1', 'c2', 'C3');
    await connector2.setUnderlyingCell('t1', 'r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
    expect(connector2.getUnderlyingTables()).toEqual({
      t1: {r1: {c1: 'C1', c2: 'C3', c3: 'C3'}},
    });
  });
});
