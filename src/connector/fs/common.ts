import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  AnyParentAddress,
  Atom,
  AtomAddress,
  Data,
  Meta,
  Timestamp,
  TimestampAddress,
} from '@synclets/@types';
import {
  DirectoryDataConnector,
  DirectoryMetaConnector,
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {isAtom, isTimestamp} from '@synclets/utils';
import {
  decodePaths,
  encodePaths,
  getDirectoryContents,
  readFileJson,
  removeFileAndAncestors,
  validateDirectory,
  validateFile,
  writeFileJson,
} from '../../common/fs.ts';
import {createMemoryConnector} from '../../common/memory.ts';

export const readLeaf = async <Leaf extends Atom | Timestamp>(
  directory: string,
  address: Address,
  isLeaf: (leaf: unknown) => leaf is Leaf | undefined,
): Promise<Leaf | undefined> => {
  const leaf = await readFileJson(directory, encodePaths(address));
  return isLeaf(leaf) ? leaf : undefined;
};

export const createFileConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  file: string,
) => {
  let validatedFile: string;

  const connect = async () => {
    validatedFile = await validateFile(file);
  };

  const onChange = (tree: CreateMeta extends true ? Meta : Data) =>
    writeFileJson(validatedFile, [], tree, false);

  const getInitialAfterConnect = () =>
    readFileJson(validatedFile, []) as Promise<
      (CreateMeta extends true ? Meta : Data) | undefined
    >;

  const extraFunctions = {
    getFile: () => file,
  };

  return createMemoryConnector(
    createMeta,
    depth,
    connect,
    onChange,
    getInitialAfterConnect,
    extraFunctions,
  ) as CreateMeta extends true
    ? FileMetaConnector<Depth>
    : FileDataConnector<Depth>;
};

export const createDirectoryConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  directory: string,
) => {
  let validatedDirectory: string;

  const connect = async () => {
    validatedDirectory = await validateDirectory(directory);
  };

  const readAtom = (address: AtomAddress<Depth>): Promise<Atom | undefined> =>
    readLeaf(validatedDirectory, address, isAtom);

  const readTimestamp = (
    address: TimestampAddress<Depth>,
  ): Promise<Timestamp | undefined> =>
    readLeaf(validatedDirectory, address, isTimestamp);

  const writeLeaf = (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => writeFileJson(validatedDirectory, encodePaths(address), leaf);

  const removeAtom = (address: AtomAddress<Depth>) =>
    removeFileAndAncestors(validatedDirectory, encodePaths(address));

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    decodePaths(
      await getDirectoryContents(validatedDirectory, encodePaths(address)),
    );

  const extraFunctions = {
    getDirectory: () => directory,
  };

  const connector = createMeta
    ? createMetaConnector(
        depth,
        {
          connect,
          readTimestamp,
          writeTimestamp: writeLeaf,
          readChildIds,
        },
        {},
        extraFunctions,
      )
    : createDataConnector(
        depth,
        {
          connect,
          readAtom,
          writeAtom: writeLeaf,
          removeAtom,
          readChildIds,
        },
        {},
        extraFunctions,
      );

  return connector as CreateMeta extends true
    ? DirectoryMetaConnector<Depth>
    : DirectoryDataConnector<Depth>;
};
