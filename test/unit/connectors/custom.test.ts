import {
  Address,
  Atom,
  Connector,
  ConnectorOptions,
  createConnector,
  Hash,
  Timestamp,
} from 'synclets';
import {getTestSyncletsAndConnectors} from '../common.ts';

type Values = {
  one: Atom;
  two: {one: Atom};
  three: {one: Atom; two: {one: Atom}};
};

type Timestamps = {
  one: Timestamp;
  two: {one: Timestamp};
  three: {one: Timestamp; two: {one: Timestamp}};
};

type Hashes = {
  _: Hash;
  two: {_: Hash};
  three: {_: Hash; two: {_: Hash}};
};

type TestCustomConnector = Connector & {
  setValueForTest: (
    address: Address,
    value: Atom,
    sync?: boolean,
  ) => Promise<void>;
  getValuesForTest: () => Values;
  getTimestampsForTest: () => Timestamps;
  getHashesForTest: () => Hashes;
  syncForTest: (address: Address) => Promise<void>;
};

const createTestCustomConnector = (
  options?: ConnectorOptions,
): TestCustomConnector => {
  const values: Values = {
    one: 'V1',
    two: {one: 'V1'},
    three: {one: 'V1', two: {one: 'V1'}},
  };
  const timestamps: Timestamps = {
    one: '',
    two: {one: ''},
    three: {one: '', two: {one: ''}},
  };
  const hashes: Hashes = {
    _: 0,
    two: {_: 0},
    three: {_: 0, two: {_: 0}},
  };

  let underlyingSync: ((address: Address) => Promise<void>) | undefined;

  const connector = createConnector(
    {
      connect: async (sync?: (address: Address) => Promise<void>) => {
        underlyingSync = sync;
      },

      readAtom: async (address: Address) => {
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

      readTimestamp: async (address: Address) => {
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

      readHash: async (address: Address) => {
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
            return 0;
        }
      },

      writeAtom: async (address: Address, atom: Atom) => {
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
      },

      writeTimestamp: async (address: Address, timestamp: Timestamp) => {
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
      },

      writeHash: async (address: Address, hash: Hash) => {
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

      isParent: async (address: Address) => {
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

      readAtomIds: async (address: Address) => {
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

      readDeletedAtomIds: async (_address: Address) => {
        return [];
      },
    },
    options,
  );

  return {
    ...connector,
    setValueForTest: async (
      address: Address,
      value: Atom,
      sync: boolean = true,
    ) => {
      await connector.setAtom(address, value, {});
      if (sync) {
        await underlyingSync?.(address);
      }
    },
    getValuesForTest: () => values,
    getTimestampsForTest: () => timestamps,
    getHashesForTest: () => hashes,
    syncForTest: async (address: Address) => await underlyingSync?.(address),
  };
};

const expectEquivalentConnectors = (
  connector1: TestCustomConnector,
  connector2: TestCustomConnector,
  values: any,
) => {
  expect(connector1.getValuesForTest()).toEqual(values);
  expect(connector2.getValuesForTest()).toEqual(values);
  expect(connector1.getTimestampsForTest()).toEqual(
    connector2.getTimestampsForTest(),
  );
  expect(connector1.getHashesForTest()).toEqual(connector2.getHashesForTest());
};

const expectDifferingConnectors = (
  connector1: TestCustomConnector,
  connector2: TestCustomConnector,
  values1: any,
  values2: any,
) => {
  expect(connector1.getValuesForTest()).toEqual(values1);
  expect(connector2.getValuesForTest()).toEqual(values2);
  expect(connector1.getTimestampsForTest()).not.toEqual(
    connector2.getTimestampsForTest(),
  );
  expect(connector1.getHashesForTest()).not.toEqual(
    connector2.getHashesForTest(),
  );
};

describe('custom sync, basics', () => {
  test('connected, initial', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    expectEquivalentConnectors(connector1, connector2, {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('connected, values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest(['one'], 'V2');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setValueForTest(['two', 'one'], 'V3');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector1.setValueForTest(['three', 'one'], 'V4');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });

    await connector2.setValueForTest(['three', 'two', 'one'], 'V5');
    expectEquivalentConnectors(connector1, connector2, {
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

    await connector1.setValueForTest(['one'], 'V2', false);
    await connector1.setValueForTest(['two', 'one'], 'V3', false);
    await connector1.syncForTest([]);

    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setValueForTest(['three', 'one'], 'V4', false);
    await connector2.setValueForTest(['three', 'two', 'one'], 'V5', false);
    await connector2.syncForTest(['three']);
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet1.start();

    await connector1.setValueForTest(['one'], 'V2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V1',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await synclet2.start();
    await connector1.setValueForTest(['one'], 'V2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V1',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {
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

    await connector1.setValueForTest(['one'], 'V2');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector1.setValueForTest(['two', 'one'], 'V3');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V3'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {
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

    await connector1.setValueForTest(['one'], 'V2');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector2.setValueForTest(['two', 'one'], 'V3');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V2',
        two: {one: 'V3'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await connector1.setValueForTest(['one'], 'V2');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V1',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await connector2.setValueForTest(['two', 'one'], 'V3');
    expectDifferingConnectors(
      connector1,
      connector2,
      {
        one: 'V2',
        two: {one: 'V1'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
      {
        one: 'V1',
        two: {one: 'V3'},
        three: {one: 'V1', two: {one: 'V1'}},
      },
    );

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors(connector1, connector2, {
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
    await connector1.setValueForTest(['one'], 'V2');
    await connector2.setValueForTest(['two', 'one'], 'V3');
    expectEquivalentConnectors(connector1, connector2, {
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
    await connector1.setValueForTest(['three', 'one'], 'V4');
    await connector2.setValueForTest(['three', 'two', 'one'], 'V5');
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValueForTest(['one'], 'V2');
    await connector2.setValueForTest(['two', 'one'], 'V3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValueForTest(['three', 'one'], 'V4');
    await connector2.setValueForTest(['three', 'two', 'one'], 'V5');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      getTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setValueForTest(['one'], 'V2');
    await connector2.setValueForTest(['one'], 'V3');
    await connector1.setValueForTest(['three', 'one'], 'V4');
    await connector2.setValueForTest(['three', 'one'], 'V5');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors(connector1, connector2, {
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
  });
});
