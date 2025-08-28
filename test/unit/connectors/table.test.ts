import {ConnectorOptions, Hash, Timestamp, Value} from 'synclets';
import {createBaseTableConnector} from 'synclets/connector/base';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestTableConnector = (options?: ConnectorOptions) => {
  const underlyingTable: {[rowId: string]: {[cellId: string]: Value}} = {};
  const underlyingTimestamps: {[rowId: string]: {[cellId: string]: Timestamp}} =
    {};
  const underlyingRowHashes: {[rowId: string]: Hash} = {};
  let underlyingTableHash: Hash = 0;

  const getUnderlyingTableHash = async () => underlyingTableHash;

  const getUnderlyingRowIds = async () => Object.keys(underlyingTable);

  const getUnderlyingRowHash = async (rowId: string) => {
    return underlyingRowHashes[rowId] ?? 0;
  };

  const getUnderlyingCellIds = async (rowId: string) => {
    return Object.keys(underlyingTable[rowId] ?? {});
  };

  const getUnderlyingCell = async (rowId: string, cellId: string) => {
    return underlyingTable[rowId]?.[cellId];
  };

  const getUnderlyingCellTimestamp = async (rowId: string, cellId: string) => {
    return underlyingTimestamps[rowId]?.[cellId] ?? '';
  };

  const setUnderlyingTableHash = async (hash: Hash) => {
    underlyingTableHash = hash;
  };

  const setUnderlyingRowHash = async (rowId: string, hash: Hash) => {
    underlyingRowHashes[rowId] = hash;
  };

  const setUnderlyingCell = async (
    rowId: string,
    cellId: string,
    value: Value,
  ) => {
    underlyingTable[rowId] = underlyingTable[rowId] || {};
    underlyingTable[rowId][cellId] = value;
  };

  const setUnderlyingCellTimestamp = async (
    rowId: string,
    cellId: string,
    timestamp: Timestamp,
  ) => {
    underlyingTimestamps[rowId] = underlyingTimestamps[rowId] || {};
    underlyingTimestamps[rowId][cellId] = timestamp;
  };

  const getTable = () => underlyingTable;

  const connector = createBaseTableConnector(
    {
      getUnderlyingTableHash,
      getUnderlyingRowIds,
      getUnderlyingRowHash,
      getUnderlyingCellIds,
      getUnderlyingCell,
      getUnderlyingCellTimestamp,
      setUnderlyingTableHash,
      setUnderlyingRowHash,
      setUnderlyingCell,
      setUnderlyingCellTimestamp,
    },
    options,
  );

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
