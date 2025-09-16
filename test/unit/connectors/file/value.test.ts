import {readFileSync} from 'fs';
import {mkdtemp, rm} from 'fs/promises';
import {tmpdir} from 'os';
import {join, sep} from 'path';
import {Atom, Atoms, ConnectorOptions, Hash, Timestamp} from 'synclets';
import {createFileConnector, type FileConnector} from 'synclets/connector/fs';
import {getUniqueId, jsonParse} from 'synclets/utils';
import {
  expectEquivalentConnectors,
  getChainedTestConnectors,
  getPooledTestSyncletsAndConnectors,
} from '../../common.ts';

type Node = [Hash, {[id: string]: Node}] | [Timestamp, Atom | undefined];

const getAtoms = (node: Node): Atoms =>
  typeof (node?.[0] ?? '') == 'string'
    ? (node?.[1] as Atom | undefined)
    : Object.fromEntries(
        Object.entries(node?.[1] ?? ({} as {[id: string]: Node})).map(
          ([id, child]) => [id, getAtoms(child)],
        ),
      );

interface TestFileConnector extends FileConnector {
  setValueForTest(value: string): Promise<void>;
  delValueForTest(): Promise<void>;
  getDataForTest(): Atoms;
  getMetaForTest(): Timestamp | undefined;
}

const createTestFileConnector = async (
  options?: ConnectorOptions,
): Promise<TestFileConnector> => {
  const connector = await createFileConnector(
    {atomDepth: 0},
    {file: join(tmp, getUniqueId()), ...options},
  );

  return {
    ...connector,

    setValueForTest: async (value: string) => connector.setAtom([], value),

    delValueForTest: async () => connector.delAtom([]),

    getDataForTest: () =>
      getAtoms(jsonParse(readFileSync(connector.getFile(), 'utf8'))),

    getMetaForTest: () => jsonParse(readFileSync(connector.getFile(), 'utf8')),
  };
};

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(tmpdir() + sep);
});

afterAll(async () => await rm(tmp, {recursive: true, force: true}));

test('file', async () => {
  const file = join(tmp, '42');
  const connector = await createFileConnector({atomDepth: 0}, {file});
  expect(connector.getFile()).toBe(file);
});

describe('2-way', () => {
  test('connected, initial', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

    expectEquivalentConnectors([connector1, connector2], undefined);
  });

  test('connected', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    await connector2.setValueForTest('V2');
    expectEquivalentConnectors([connector1, connector2], 'V2');
  });

  test('connected, deletion', async () => {
    const [[, connector1], [, connector2]] =
      await getPooledTestSyncletsAndConnectors(createTestFileConnector, 2);

    await connector1.setValueForTest('V1');
    expectEquivalentConnectors([connector1, connector2], 'V1');

    const timestamp = connector1.getMetaForTest();
    await connector1.delValueForTest();
    expectEquivalentConnectors([connector1, connector2], undefined);
    expect(timestamp).not.toEqual(connector1.getMetaForTest());
  });
});

describe.each([3, 10])('%d-way', (count: number) => {
  test('pool', async () => {
    const syncletsAndConnectors = await getPooledTestSyncletsAndConnectors(
      createTestFileConnector,
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
      createTestFileConnector,
      count,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });

  test('ring', async () => {
    const connectors = await getChainedTestConnectors(
      createTestFileConnector,
      count,
      true,
    );

    for (const [i, connector] of connectors.entries()) {
      await connector.setValueForTest('V' + i);
      expectEquivalentConnectors(connectors, 'V' + i);
    }
  });
});
