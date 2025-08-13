import {ConnectorOptions, Hash, Timestamp, Value} from 'synclets';
import {createTableConnector} from 'synclets/connector/table';
import {getHash} from 'synclets/utils';
import {getTestSyncletsAndConnectors} from './common.ts';

const createTestTableConnector = (options?: ConnectorOptions) => {
  const underlyingTable: {[rowId: string]: {[cellId: string]: Value}} = {};
  const underlyingTimestamps: {[rowId: string]: {[cellId: string]: Timestamp}} =
    {};
  const underlyingRowHash: {[rowId: string]: Hash} = {};
  let underlyingTableHash: Hash = 0;
  let underlyingSync:
    | ((rowId?: string, cellId?: string) => Promise<void>)
    | undefined;

  const connect = async (
    sync: (rowId?: string, cellId?: string) => Promise<void>,
  ) => {
    underlyingSync = sync;
  };

  const getTableHash = async () => underlyingTableHash;

  const getRowIds = async () => Object.keys(underlyingTable);

  const getRowHash = async (rowId: string) => {
    return underlyingRowHash[rowId] ?? 0;
  };

  const getCellIds = async (rowId: string) => {
    return Object.keys(underlyingTable[rowId] ?? {});
  };

  const getCell = async (rowId: string, cellId: string) => {
    return underlyingTable[rowId]?.[cellId];
  };

  const getCellTimestamp = async (rowId: string, cellId: string) => {
    return underlyingTimestamps[rowId]?.[cellId] ?? '';
  };

  const setTableHash = async (hash: Hash) => {
    underlyingTableHash = hash;
  };

  const setRowHash = async (rowId: string, hash: Hash) => {
    underlyingRowHash[rowId] = hash;
  };

  const setCell = async (rowId: string, cellId: string, value: Value) => {
    underlyingTable[rowId] = underlyingTable[rowId] || {};
    underlyingTable[rowId][cellId] = value;
  };

  const setCellTimestamp = async (
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => {
    underlyingTimestamps[rowId] = underlyingTimestamps[rowId] || {};
    underlyingTimestamps[rowId][cellId] = timestamp;
  };

  const getUnderlyingTable = () => underlyingTable;

  const setUnderlyingCell = async (
    rowId: string,
    cellId: string,
    value: Value,
  ) => {
    const timestamp = connector.getNextTimestamp();
    underlyingTable[rowId] = underlyingTable[rowId] || {};
    underlyingTable[rowId][cellId] = value;
    underlyingTimestamps[rowId] = underlyingTimestamps[rowId] || {};
    underlyingTimestamps[rowId][cellId] = timestamp;

    underlyingRowHash[rowId] =
      (underlyingRowHash[rowId] ^ getHash(timestamp)) >>> 0;
    underlyingTableHash =
      (underlyingTableHash ^ underlyingRowHash[rowId]) >>> 0;
    await underlyingSync?.(rowId, cellId);
  };

  const connector = createTableConnector(
    {
      connect,
      getTableHash,
      getRowIds,
      getRowHash,
      getCellIds,
      getCell,
      getCellTimestamp,
      setTableHash,
      setRowHash,
      setCell,
      setCellTimestamp,
    },
    options,
  );
  return {
    ...connector,
    getUnderlyingTable,
    setUnderlyingCell,
  };
};

describe('table sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingTable()).toEqual(
      connector2.getUnderlyingTable(),
    );
  });

  test('connected', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});

    await connector2.setUnderlyingCell('r1', 'c1', 'C2');
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();

    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({});

    await synclet2.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet2.start();
    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({});

    await synclet1.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector1.setUnderlyingCell('r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});

    await synclet1.stop();
    await connector2.setUnderlyingCell('r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});

    await synclet1.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);

    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({});

    await connector2.setUnderlyingCell('r1', 'c1', 'C2');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C2'}});
  });
});

describe('table sync, multiple values', () => {
  test('connected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('r1', 'c2', 'C2');
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
  });
  test('disconnected, different values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('r1', 'c2', 'C2');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
    expect(connector2.getUnderlyingTable()).toEqual({r1: {c1: 'C1', c2: 'C2'}});
  });
  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestTableConnector, 2);
    await connector1.setUnderlyingCell('r1', 'c1', 'C1');
    await connector2.setUnderlyingCell('r1', 'c2', 'C2');
    await connector1.setUnderlyingCell('r1', 'c2', 'C3');
    await connector2.setUnderlyingCell('r1', 'c3', 'C3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingTable()).toEqual({
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
    expect(connector2.getUnderlyingTable()).toEqual({
      r1: {c1: 'C1', c2: 'C3', c3: 'C3'},
    });
  });
});
