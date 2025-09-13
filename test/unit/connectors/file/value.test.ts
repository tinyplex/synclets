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
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
} from '../../common.ts';

interface TestFileValueConnector extends FileValueConnector {
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

    await connector1.setValue('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await connector2.setValue('V2');
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileValueConnector, 2);

    await connector1.setValue('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    const timestamp = connector1.getMetaForTest();
    await connector1.delValue();
    expectEquivalentConnectors([connector1, connector2], undefined);
    expect(timestamp).not.toEqual(connector1.getMetaForTest());
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
      await connector.setValue('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('chain', async () => {
    const connectors = await getChainedTestConnectors(
      createTestFileValueConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValue('V' + i);
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
      await connector.setValue('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });
});
