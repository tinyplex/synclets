import {readFileSync} from 'fs';
import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Atom, ConnectorOptions, Timestamp} from 'synclets';
import {
  createFileValueConnector,
  FileValueConnector,
} from 'synclets/connector/file';
import {getUniqueId, jsonParse} from 'synclets/utils';
import {
  expectDifferingConnectors,
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
  pause,
} from '../../common.ts';

interface TestFileValueConnector extends FileValueConnector {
  setValueForTest(value: Atom): Promise<void>;
  delValueForTest(): Promise<void>;
  getDataForTest(): Atom | undefined;
  getMetaForTest(): Timestamp | undefined;
}

const createTestFileValueConnector = async (
  options?: ConnectorOptions,
): Promise<TestFileValueConnector> => {
  const connector = await createFileValueConnector(
    join(tmp, getUniqueId()),
    options,
  );

  return {
    ...connector,

    setValueForTest: (value: Atom) => connector.setValue(value),

    delValueForTest: () => connector.delValue(),

    getDataForTest: () =>
      jsonParse(readFileSync(connector.getDirectory() + '/data', 'utf8')),

    getMetaForTest: () =>
      jsonParse(readFileSync(connector.getDirectory() + '/meta', 'utf8')),
  };
};

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(tmpdir() + sep);
});

afterAll(async () => await rm(tmp, {recursive: true, force: true}));

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileValueConnector, 2);

    expectEquivalentConnectors([connector1, connector2], undefined);
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileValueConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileValueConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    const timestamp = connector1.getMetaForTest();
    await connector1.delValueForTest();
    expectEquivalentConnectors([connector1, connector2], undefined);
    expect(timestamp).not.toEqual(connector1.getMetaForTest());
  });

  test('start 1, set 1, start 2', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestFileValueConnector,
        2,
        false,
      );

    await synclet1.start();

    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await synclet2.start();
    expectEquivalentConnectors([connector1, connector2], 'V1');
  });

  test('start 2, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestFileValueConnector,
        2,
        false,
      );

    await synclet2.start();
    await connector1.connect();
    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V1');
  });

  test('stop 1, set 1, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestFileValueConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await synclet1.stop();
    await connector1.connect();
    await connector1.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V2', 'V1');

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('stop 1, set 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestFileValueConnector,
        2,
        false,
      );

    await synclet1.start();
    await synclet2.start();

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await synclet1.stop();
    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('set 1, set 2, start 2, start 1', async () => {
    const [[synclet1, connector1], [synclet2, connector2]] =
      await getPooledTestSyncletsAndConnectors(
        createTestFileValueConnector,
        2,
        false,
      );

    await connector1.connect();
    await connector1.setValueForTest('V1');
    expectDifferingConnectors(connector1, connector2, 'V1', undefined);

    await pause();

    await connector2.connect();
    await connector2.setValueForTest('V2');
    expectDifferingConnectors(connector1, connector2, 'V1', 'V2');

    await synclet2.start();
    await synclet1.start();
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestFileValueConnector,
      count,
    );

    const connectors = syncletsAndConnectors.map(([, connector]) => connector);

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestFileValueConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestFileValueConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });
});
