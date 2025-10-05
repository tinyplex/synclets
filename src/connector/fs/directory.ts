import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  AnyParentAddress,
  Atom,
  AtomAddress,
  Atoms,
  AtomsAddress,
  Context,
  Timestamp,
  TimestampAddress,
  Timestamps,
  TimestampsAddress,
} from '@synclets/@types';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  DirectoryDataConnector,
  DirectoryMetaConnector,
} from '@synclets/@types/connector/fs';
import {isAtom, isTimestamp} from '@synclets/utils';
import {arrayMap} from '../../common/array.ts';
import {
  getDirectoryContents,
  readFileJson,
  removeFileAndAncestors,
  validateDirectory,
  writeFileJson,
} from '../../common/fs.ts';
import {objFreeze} from '../../common/object.ts';
import {isUndefined, promiseAll} from '../../common/other.ts';

const readLeaf = async <Leaf extends Atom | Timestamp>(
  directory: string,
  address: Address,
  isLeaf: (leaf: unknown) => leaf is Leaf | undefined,
): Promise<Leaf | undefined> => {
  const leaf = await readFileJson(directory, address);
  return isLeaf(leaf) ? leaf : undefined;
};

const readLeaves = async <Leaf extends Atom | Timestamp>(
  directory: string,
  address: Address,
  isLeaf: (leaf: unknown) => leaf is Leaf | undefined,
): Promise<{[id: string]: Leaf}> => {
  const leaves: {[id: string]: Leaf} = {};
  await promiseAll(
    arrayMap(await getDirectoryContents(directory, address), async (id) => {
      const leaf = await readFileJson(directory, [...(address as Address), id]);
      if (isLeaf(leaf) && !isUndefined(leaf)) {
        leaves[id] = leaf;
      }
    }),
  );
  return leaves;
};

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryDataConnector<Depth>> => {
    const directory = await validateDirectory(path);

    const readAtom = async (
      address: AtomAddress<Depth>,
    ): Promise<Atom | undefined> => readLeaf(directory, address, isAtom);

    const writeAtom = (
      address: AtomAddress<Depth>,
      atom: Atom,
      _context: Context,
    ) => writeFileJson(directory, address, atom);

    const removeAtom = (address: AtomAddress<Depth>, _context: Context) =>
      removeFileAndAncestors(directory, address);

    const readChildIds = (
      address: AnyParentAddress<Depth>,
      _context: Context,
    ) => getDirectoryContents(directory, address);

    const readAtoms = async (
      address: AtomsAddress<Depth>,
      _context: Context,
    ): Promise<Atoms> => readLeaves(directory, address, isAtom);

    const dataConnector = await createDataConnector(depth, {
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
      readAtoms,
    });

    return objFreeze({
      ...dataConnector,
      getDirectory: () => directory,
    });
  };

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryMetaConnector<Depth>> => {
    const directory = await validateDirectory(path);

    const readTimestamp = async (
      address: TimestampAddress<Depth>,
      _context: Context,
    ): Promise<Timestamp | undefined> =>
      readLeaf(directory, address, isTimestamp);

    const writeTimestamp = async (
      address: TimestampAddress<Depth>,
      timestamp: Timestamp,
      _context: Context,
    ) => writeFileJson(directory, address, timestamp);

    const readChildIds = async (
      address: AnyParentAddress<Depth>,
      _context: Context,
    ) => getDirectoryContents(directory, address);

    const readTimestamps = async (
      address: TimestampsAddress<Depth>,
      _context: Context,
    ): Promise<Timestamps> => readLeaves(directory, address, isTimestamp);

    const metaConnector = await createMetaConnector(depth, {
      readTimestamp,
      writeTimestamp,
      readChildIds,
      readTimestamps,
    });

    return objFreeze({
      ...metaConnector,
      getDirectory: () => directory,
    });
  };
