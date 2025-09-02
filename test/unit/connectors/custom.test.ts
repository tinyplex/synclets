import {
  Address,
  ConnectorOptions,
  createConnector,
  Hash,
  Timestamp,
  Value,
} from 'synclets';
import {getTimestampHash} from 'synclets/utils';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestCustomConnector = (options?: ConnectorOptions) => {
  const underlyingValues: any = {
    one: 'V1',
    two: {one: 'V1'},
    three: {one: 'V1', two: {one: 'V1'}},
  };
  const underlyingTimestamps: any = {
    one: '',
    two: {one: ''},
    three: {one: '', two: {one: ''}},
  };
  const underlyingHashes: any = {
    _: 0,
    two: {_: 0},
    three: {_: 0, two: {_: 0}},
  };

  let underlyingSync: ((address: Address) => Promise<void>) | undefined;

  const connect = async (sync: (address: Address) => Promise<void>) => {
    underlyingSync = sync;
  };

  const getValue = async (address: Address) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        return underlyingValues.one;
      case '["two","one"]':
        return underlyingValues.two.one;
      case '["three","one"]':
        return underlyingValues.three.one;
      case '["three","two","one"]':
        return underlyingValues.three.two.one;
      default:
        return undefined;
    }
  };

  const getTimestamp = async (address: Address) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        return underlyingTimestamps.one;
      case '["two","one"]':
        return underlyingTimestamps.two.one;
      case '["three","one"]':
        return underlyingTimestamps.three.one;
      case '["three","two","one"]':
        return underlyingTimestamps.three.two.one;
      default:
        return '';
    }
  };

  const getHash = async (address: Address) => {
    switch (JSON.stringify(address)) {
      case '[]':
        return underlyingHashes._;
      case '["two"]':
        return underlyingHashes.two._;
      case '["three"]':
        return underlyingHashes.three._;
      case '["three","two"]':
        return underlyingHashes.three.two._;
      default:
        return '';
    }
  };

  const setValue = async (address: Address, value: Value) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        underlyingValues.one = value;
        return;
      case '["two","one"]':
        underlyingValues.two.one = value;
        return;
      case '["three","one"]':
        underlyingValues.three.one = value;
        return;
      case '["three","two","one"]':
        underlyingValues.three.two.one = value;
        return;
    }
  };

  const setTimestamp = async (address: Address, timestamp: Timestamp) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        underlyingTimestamps.one = timestamp;
        return;
      case '["two","one"]':
        underlyingTimestamps.two.one = timestamp;
        return;
      case '["three","one"]':
        underlyingTimestamps.three.one = timestamp;
        return;
      case '["three","two","one"]':
        underlyingTimestamps.three.two.one = timestamp;
        return;
    }
  };

  const setHash = async (address: Address, hash: Hash) => {
    switch (JSON.stringify(address)) {
      case '[]':
        underlyingHashes._ = hash;
        return;
      case '["two"]':
        underlyingHashes.two._ = hash;
        return;
      case '["three"]':
        underlyingHashes.three._ = hash;
        return;
      case '["three","two"]':
        underlyingHashes.three.two._ = hash;
        return;
    }
  };

  const hasChildren = async (address: Address) => {
    switch (JSON.stringify(address)) {
      case '[]':
      case '["two"]':
      case '["three"]':
      case '["three","two"]':
        return true;
      default:
        return false;
    }
  };

  const getChildren = async (address: Address) => {
    switch (JSON.stringify(address)) {
      case '[]':
        return ['one', 'two', 'three'];
      case '["two"]':
        return ['one'];
      case '["three"]':
        return ['one', 'two'];
      case '["three","two"]':
        return ['one'];
      default:
        return [];
    }
  };

  const getUnderlyingValues = () => underlyingValues;

  const setUnderlyingValue = async (
    address: Address,
    value: Value,
    sync: boolean = true,
  ) => {
    const timestamp = connector.getNextTimestamp();
    setValue(address, value);
    setTimestamp(address, timestamp);
    const hash = getTimestampHash(timestamp);
    switch (JSON.stringify(address)) {
      case '["one"]':
        underlyingHashes._ = (underlyingHashes._ ^ hash) >>> 0;
        break;
      case '["two","one"]':
        underlyingHashes.two._ = (underlyingHashes.two._ ^ hash) >>> 0;
        underlyingHashes._ = (underlyingHashes._ ^ hash) >>> 0;
        break;
      case '["three","one"]':
        underlyingHashes.three._ = (underlyingHashes.three._ ^ hash) >>> 0;
        underlyingHashes._ = (underlyingHashes._ ^ hash) >>> 0;
        break;
      case '["three","two","one"]':
        underlyingHashes.three.two._ =
          (underlyingHashes.three.two._ ^ hash) >>> 0;
        underlyingHashes.three._ = (underlyingHashes.three._ ^ hash) >>> 0;
        underlyingHashes._ = (underlyingHashes._ ^ hash) >>> 0;
        break;
    }
    if (sync) {
      await underlyingSync?.(address);
    }
  };

  const sync = async (address: Address) => {
    await underlyingSync?.(address);
  };

  const connector = createConnector(
    {
      connect,
      getValue,
      getHash,
      getTimestamp,
      setValue,
      setHash,
      setTimestamp,
      hasChildren,
      getChildren,
    },
    options,
  );
  return {
    ...connector,
    getUnderlyingValues,
    setUnderlyingValue,
    sync,
  };
};

describe('custom sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getUnderlyingValues()).toEqual(
      connector2.getUnderlyingValues(),
    );
  });

  test('connected, values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setUnderlyingValue(['two', 'one'], 'V3');
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector1.setUnderlyingValue(['three', 'one'], 'V4');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });

    await connector2.setUnderlyingValue(['three', 'two', 'one'], 'V5');
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('connected, value parents', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue(['one'], 'V2', false);
    await connector1.setUnderlyingValue(['two', 'one'], 'V3', false);
    await connector1.sync([]);

    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setUnderlyingValue(['three', 'one'], 'V4', false);
    await connector2.setUnderlyingValue(['three', 'two', 'one'], 'V5', false);
    await connector2.sync(['three']);
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();

    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet2.start();
    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector1.setUnderlyingValue(['two', 'one'], 'V3');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector2.setUnderlyingValue(['two', 'one'], 'V3');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await connector1.setUnderlyingValue(['one'], 'V2');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setUnderlyingValue(['two', 'one'], 'V3');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });
});

describe('custom sync, multiple values', () => {
  test('connected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setUnderlyingValue(['one'], 'V2');
    await connector2.setUnderlyingValue(['two', 'one'], 'V3');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('connected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await synclet1.start();
    await synclet2.start();
    await connector1.setUnderlyingValue(['three', 'one'], 'V4');
    await connector2.setUnderlyingValue(['three', 'two', 'one'], 'V5');
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setUnderlyingValue(['one'], 'V2');
    await connector2.setUnderlyingValue(['two', 'one'], 'V3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setUnderlyingValue(['three', 'one'], 'V4');
    await connector2.setUnderlyingValue(['three', 'two', 'one'], 'V5');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setUnderlyingValue(['one'], 'V2');
    await connector2.setUnderlyingValue(['one'], 'V3');
    await connector1.setUnderlyingValue(['three', 'one'], 'V4');
    await connector2.setUnderlyingValue(['three', 'one'], 'V5');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getUnderlyingValues()).toEqual({
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
    expect(connector2.getUnderlyingValues()).toEqual({
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
  });
});
