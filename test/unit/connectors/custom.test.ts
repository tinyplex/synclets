import {
  Address,
  Atom,
  Connector,
  ConnectorOptions,
  createConnector,
  Hash,
  Timestamp,
} from 'synclets';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../common.ts';

type Values = {
  one?: Atom;
  two: {one?: Atom};
  three: {one?: Atom; two: {one?: Atom}};
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

interface TestCustomConnector extends Connector {
  getDataForTest(): Values;
  getMetaForTest(): [Timestamps, Hashes];
}

const createTestCustomConnector = async (
  options?: ConnectorOptions,
): Promise<TestCustomConnector> => {
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

  const connector = await createConnector(
    {
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

      readChildIds: async (address: Address) => {
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

      removeAtom: async (address: Address) => {
        switch (JSON.stringify(address)) {
          case '["one"]':
            delete values.one;
            return;
          case '["two","one"]':
            delete values.two.one;
            return;
          case '["three","one"]':
            delete values.three.one;
            return;
          case '["three","two","one"]':
            delete values.three.two.one;
            return;
        }
      },
    },
    options,
  );

  return {
    ...connector,

    getDataForTest: () => values,

    getMetaForTest: () => [timestamps, hashes],
  };
};

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestCustomConnector, 2);

    expectEquivalentConnectors([connector1, connector2], {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('connected, values', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await connector1.setAtom(['one'], 'V2');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setAtom(['two', 'one'], 'V3');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector1.setAtom(['three', 'one'], 'V4');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V1'}},
    });

    await connector2.setAtom(['three', 'two', 'one'], 'V5');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });

    const timestamp = connector1.getMetaForTest()[0].one;
    await connector1.delAtom(['one']);
    expectEquivalentConnectors([connector1, connector2], {
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
    expect(timestamp).not.toEqual(connector1.getMetaForTest()[0].one);
  });

  test('connected, value parents', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestCustomConnector, 2);

    await connector1.setAtom(['one'], 'V2', {}, false);
    await connector1.setAtom(['two', 'one'], 'V3', {}, false);
    await synclet1.sync([]);

    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await connector2.setAtom(['three', 'one'], 'V4', {}, false);
    await connector2.setAtom(['three', 'two', 'one'], 'V5', {}, false);
    await synclet2.sync(['three']);
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await synclet1.start();

    await connector1.setAtom(['one'], 'V2');
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
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await synclet2.start();
    await connector1.connect();
    await connector1.setAtom(['one'], 'V2');
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
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setAtom(['one'], 'V2');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector1.connect();
    await connector1.setAtom(['two', 'one'], 'V3');
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
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setAtom(['one'], 'V2');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V1'},
      three: {one: 'V1', two: {one: 'V1'}},
    });

    await synclet1.stop();
    await connector2.setAtom(['two', 'one'], 'V3');
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
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector1.setAtom(['one'], 'V2');
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

    await connector2.connect();
    await connector2.setAtom(['two', 'one'], 'V3');
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
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('connected, different values 1', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setAtom(['one'], 'V2');
    await connector2.setAtom(['two', 'one'], 'V3');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('connected, different values 2', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestCustomConnector, 2);
    await connector1.setAtom(['three', 'one'], 'V4');
    await connector2.setAtom(['three', 'two', 'one'], 'V5');
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, different values 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setAtom(['one'], 'V2');
    await connector2.setAtom(['two', 'one'], 'V3');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V2',
      two: {one: 'V3'},
      three: {one: 'V1', two: {one: 'V1'}},
    });
  });

  test('disconnected, different values 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );
    await connector1.connect();
    await connector2.connect();
    await connector1.setAtom(['three', 'one'], 'V4');
    await connector2.setAtom(['three', 'two', 'one'], 'V5');
    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V1',
      two: {one: 'V1'},
      three: {one: 'V4', two: {one: 'V5'}},
    });
  });

  test('disconnected, conflicting values', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestCustomConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector2.connect();

    await connector1.setAtom(['one'], 'V2');
    await pause();
    await connector2.setAtom(['one'], 'V3');

    await connector1.setAtom(['three', 'one'], 'V4');
    await pause();
    await connector2.setAtom(['three', 'one'], 'V5');

    await synclet1.start();
    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], {
      one: 'V3',
      two: {one: 'V1'},
      three: {one: 'V5', two: {one: 'V1'}},
    });
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestCustomConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setAtom(['one'], 'V' + i);
      await connector.setAtom(['two', 'one'], 'V' + (i + 1));
      await connector.setAtom(['three', 'one'], 'V' + (i + 2));
      await connector.setAtom(['three', 'two', 'one'], 'V' + (i + 3));
      expectEquivalentConnectors(connectors, {
        one: 'V' + i,
        two: {one: 'V' + (i + 1)},
        three: {one: 'V' + (i + 2), two: {one: 'V' + (i + 3)}},
      });
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestCustomConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setAtom(['one'], 'V' + i);
      await connector.setAtom(['two', 'one'], 'V' + (i + 1));
      await connector.setAtom(['three', 'one'], 'V' + (i + 2));
      await connector.setAtom(['three', 'two', 'one'], 'V' + (i + 3));
      expectEquivalentConnectors(connectors, {
        one: 'V' + i,
        two: {one: 'V' + (i + 1)},
        three: {one: 'V' + (i + 2), two: {one: 'V' + (i + 3)}},
      });
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestCustomConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setAtom(['one'], 'V' + i);
      await connector.setAtom(['two', 'one'], 'V' + (i + 1));
      await connector.setAtom(['three', 'one'], 'V' + (i + 2));
      await connector.setAtom(['three', 'two', 'one'], 'V' + (i + 3));
      expectEquivalentConnectors(connectors, {
        one: 'V' + i,
        two: {one: 'V' + (i + 1)},
        three: {one: 'V' + (i + 2), two: {one: 'V' + (i + 3)}},
      });
    }
  });
});
