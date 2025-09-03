import {
  Address,
  Atom,
  ConnectorOptions,
  createConnector,
  Hash,
  Timestamp,
} from 'synclets';
import {getTimestampHash} from 'synclets/utils';
import {getTestSyncletsAndConnectors} from '../common.ts';

const createTestCustomConnector = (options?: ConnectorOptions) => {
  const values: any = {
    one: 'V1',
    two: {one: 'V1'},
    three: {one: 'V1', two: {one: 'V1'}},
  };
  const timestamps: any = {
    one: '',
    two: {one: ''},
    three: {one: '', two: {one: ''}},
  };
  const hashes: any = {
    _: 0,
    two: {_: 0},
    three: {_: 0, two: {_: 0}},
  };

  let underlyingSync: ((address: Address) => Promise<void>) | undefined;

  const setAtom = async (address: Address, atom: Atom) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        values.one = atom;
        return;
      case '["two","one"]':
        values.two.one = atom;
        return;
      case '["three","one"]':
        values.three.one = atom;
        return;
      case '["three","two","one"]':
        values.three.two.one = atom;
        return;
    }
  };

  const setTimestamp = async (address: Address, timestamp: Timestamp) => {
    switch (JSON.stringify(address)) {
      case '["one"]':
        timestamps.one = timestamp;
        return;
      case '["two","one"]':
        timestamps.two.one = timestamp;
        return;
      case '["three","one"]':
        timestamps.three.one = timestamp;
        return;
      case '["three","two","one"]':
        timestamps.three.two.one = timestamp;
        return;
    }
  };

  const connector = createConnector(
    {
      connect: async (sync: (address: Address) => Promise<void>) => {
        underlyingSync = sync;
      },

      getAtom: async (address: Address) => {
        switch (JSON.stringify(address)) {
          case '["one"]':
            return values.one;
          case '["two","one"]':
            return values.two.one;
          case '["three","one"]':
            return values.three.one;
          case '["three","two","one"]':
            return values.three.two.one;
          default:
            return undefined;
        }
      },

      getHash: async (address: Address) => {
        switch (JSON.stringify(address)) {
          case '[]':
            return hashes._;
          case '["two"]':
            return hashes.two._;
          case '["three"]':
            return hashes.three._;
          case '["three","two"]':
            return hashes.three.two._;
          default:
            return '';
        }
      },

      getTimestamp: async (address: Address) => {
        switch (JSON.stringify(address)) {
          case '["one"]':
            return timestamps.one;
          case '["two","one"]':
            return timestamps.two.one;
          case '["three","one"]':
            return timestamps.three.one;
          case '["three","two","one"]':
            return timestamps.three.two.one;
          default:
            return '';
        }
      },

      setAtom,

      setHash: async (address: Address, hash: Hash) => {
        switch (JSON.stringify(address)) {
          case '[]':
            hashes._ = hash;
            return;
          case '["two"]':
            hashes.two._ = hash;
            return;
          case '["three"]':
            hashes.three._ = hash;
            return;
          case '["three","two"]':
            hashes.three.two._ = hash;
            return;
        }
      },

      setTimestamp,

      hasChildren: async (address: Address) => {
        switch (JSON.stringify(address)) {
          case '[]':
          case '["two"]':
          case '["three"]':
          case '["three","two"]':
            return true;
          default:
            return false;
        }
      },

      getChildren: async (address: Address) => {
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
      },
    },
    options,
  );

  const getValues = () => values;

  const setValue = async (
    address: Address,
    atom: Atom,
    sync: boolean = true,
  ) => {
    const timestamp = connector.getNextTimestamp();
    setAtom(address, atom);
    setTimestamp(address, timestamp);
    const hash = getTimestampHash(timestamp);
    switch (JSON.stringify(address)) {
      case '["one"]':
        hashes._ = (hashes._ ^ hash) >>> 0;
        break;
      case '["two","one"]':
        hashes.two._ = (hashes.two._ ^ hash) >>> 0;
        hashes._ = (hashes._ ^ hash) >>> 0;
        break;
      case '["three","one"]':
        hashes.three._ = (hashes.three._ ^ hash) >>> 0;
        hashes._ = (hashes._ ^ hash) >>> 0;
        break;
      case '["three","two","one"]':
        hashes.three.two._ = (hashes.three.two._ ^ hash) >>> 0;
        hashes.three._ = (hashes.three._ ^ hash) >>> 0;
        hashes._ = (hashes._ ^ hash) >>> 0;
        break;
    }
    if (sync) {
      await underlyingSync?.(address);
    }
  };

  const sync = (address: Address) => underlyingSync?.(address);

  return {
    ...connector,
    getValues,
    setValue,
    sync,
  };
};

describe('custom sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expect(connector1.getValues()).toEqual(connector2.getValues());
  });

  test('connected, values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setValue(['two', 'one'], 'V3');
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector1.setValue(['three', 'one'], 'V4');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });

    await connector2.setValue(['three', 'two', 'one'], 'V5');
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector1.getValues()).toEqual({
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

    await connector1.setValue(['one'], 'V2', false);
    await connector1.setValue(['two', 'one'], 'V3', false);
    await connector1.sync([]);

    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setValue(['three', 'one'], 'V4', false);
    await connector2.setValue(['three', 'two', 'one'], 'V5', false);
    await connector2.sync(['three']);
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();

    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet2.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet2.start();
    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
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

    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector1.setValue(['two', 'one'], 'V3');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
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

    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector2.setValue(['two', 'one'], 'V3');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await connector1.setValue(['one'], 'V2');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setValue(['two', 'one'], 'V3');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet2.start();
    await synclet1.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
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
    await connector1.setValue(['one'], 'V2');
    await connector2.setValue(['two', 'one'], 'V3');
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
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
    await connector1.setValue(['three', 'one'], 'V4');
    await connector2.setValue(['three', 'two', 'one'], 'V5');
    expect(connector1.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValue(['one'], 'V2');
    await connector2.setValue(['two', 'one'], 'V3');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValue(['three', 'one'], 'V4');
    await connector2.setValue(['three', 'two', 'one'], 'V5');
    await synclet1.start();
    await synclet2.start();
    expect(connector1.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValue(['one'], 'V2');
    await connector2.setValue(['one'], 'V3');
    await connector1.setValue(['three', 'one'], 'V4');
    await connector2.setValue(['three', 'one'], 'V5');

    await synclet1.start();
    await synclet2.start();
    expect(connector1.getValues()).toEqual({
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
    expect(connector2.getValues()).toEqual({
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
  });
});
