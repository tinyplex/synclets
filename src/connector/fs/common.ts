import type {Address, Atom, Data, Meta, Timestamp} from '@synclets/@types';
import {
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {
  encodePaths,
  readFileJson,
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
