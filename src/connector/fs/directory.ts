import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  AnyParentAddress,
  Atom,
  AtomAddress,
  Timestamp,
  TimestampAddress,
} from '@synclets/@types';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  DirectoryDataConnector,
  DirectoryMetaConnector,
} from '@synclets/@types/connector/fs';
import {isAtom, isTimestamp} from '@synclets/utils';
import {
  decodePaths,
  encodePaths,
  getDirectoryContents,
  readFileJson,
  removeFileAndAncestors,
  validateDirectory,
  writeFileJson,
} from '../../common/fs.ts';
import {objFreeze} from '../../common/object.ts';

const readLeaf = async <Leaf extends Atom | Timestamp>(
  directory: string,
  address: Address,
  isLeaf: (leaf: unknown) => leaf is Leaf | undefined,
): Promise<Leaf | undefined> => {
  const leaf = await readFileJson(directory, encodePaths(address));
  return isLeaf(leaf) ? leaf : undefined;
};

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryDataConnector<Depth> => {
    let validatedDirectory: string;

    const connect = async () => {
      validatedDirectory = await validateDirectory(directory);
    };

    const readAtom = (address: AtomAddress<Depth>): Promise<Atom | undefined> =>
      readLeaf(validatedDirectory, address, isAtom);

    const writeAtom = (address: AtomAddress<Depth>, atom: Atom) =>
      writeFileJson(validatedDirectory, encodePaths(address), atom);

    const removeAtom = (address: AtomAddress<Depth>) =>
      removeFileAndAncestors(validatedDirectory, encodePaths(address));

    const readChildIds = async (address: AnyParentAddress<Depth>) =>
      decodePaths(
        await getDirectoryContents(validatedDirectory, encodePaths(address)),
      );

    const dataConnector = createDataConnector(depth, {
      connect,
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
    });

    const getDirectory = () => directory;

    return objFreeze({
      ...dataConnector,
      getDirectory,
    });
  };

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryMetaConnector<Depth> => {
    let validatedDirectory: string;

    const connect = async () => {
      validatedDirectory = await validateDirectory(directory);
    };

    const readTimestamp = (
      address: TimestampAddress<Depth>,
    ): Promise<Timestamp | undefined> =>
      readLeaf(validatedDirectory, address, isTimestamp);

    const writeTimestamp = (
      address: TimestampAddress<Depth>,
      timestamp: Timestamp,
    ) => writeFileJson(validatedDirectory, encodePaths(address), timestamp);

    const readChildIds = async (address: AnyParentAddress<Depth>) =>
      decodePaths(
        await getDirectoryContents(validatedDirectory, encodePaths(address)),
      );

    const metaConnector = createMetaConnector(depth, {
      connect,
      readTimestamp,
      writeTimestamp,
      readChildIds,
    });

    const getDirectory = () => directory;

    return objFreeze({
      ...metaConnector,
      getDirectory,
    });
  };
