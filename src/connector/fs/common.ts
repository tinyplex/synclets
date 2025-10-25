import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  AnyParentAddress,
  Atom,
  AtomAddress,
  Data,
  Meta,
  MetaConnectorImplementations,
  Timestamp,
  TimestampAddress,
} from '@synclets/@types';
import {
  DirectoryDataConnector,
  DirectoryMetaConnector,
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {isAtom, isTimestamp, jsonParse, jsonString} from '@synclets/utils';
import {
  access,
  constants,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'fs/promises';
import {dirname, resolve} from 'path';
import {arrayMap, arrayReduce, arraySlice} from '../../common/array.ts';
import {createMemoryConnector} from '../../common/memory.ts';
import {errorNew, isEmpty} from '../../common/other.ts';
import {stringReplaceAll, UTF8} from '../../common/string.ts';
export {resolve} from 'path';

const {R_OK, W_OK} = constants;
const IS_NOT = ' is not ';
const CANT_MAKE = `Can't make `;

const EXTRA_ENCODES = [
  ['*', '%2A'],
  ['.', '%2E'],
  ['~', '%7E'],
];

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

  const readLeaf = async <Leaf extends Atom | Timestamp>(
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
  ): Promise<Atom | Timestamp | undefined> => {
    const leaf = await readFileJson(validatedDirectory, encodePaths(address));
    return (createMeta ? isTimestamp : isAtom)(leaf) ? leaf : undefined;
  };

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
          readTimestamp:
            readLeaf as MetaConnectorImplementations<Depth>['readTimestamp'],
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
          readAtom: readLeaf,
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

const encodePaths = (paths: string[]): string[] =>
  arrayMap(paths, (path: string) =>
    arrayReduce(
      EXTRA_ENCODES,
      (str, [char, code]) => stringReplaceAll(str, char, code),
      encodeURIComponent(path),
    ),
  );

const decodePaths = (paths: string[]): string[] =>
  arrayMap(paths, (path: string) =>
    decodeURIComponent(
      arrayReduce(
        EXTRA_ENCODES,
        (str, [char, code]) => stringReplaceAll(str, code, char),
        path,
      ),
    ),
  );

const makeDirectory = (directory: string) =>
  mkdir(directory, {recursive: true, mode: 0o755});

const validateReadWrite = async (path: string) => {
  try {
    await access(path, R_OK | W_OK);
  } catch {
    errorNew(`${path}${IS_NOT}read-write`);
  }
};

const readFileJson = async (
  root: string,
  paths: string[],
): Promise<unknown> => {
  try {
    return jsonParse(await readFile(resolve(root, ...paths), UTF8));
  } catch {}
};

const writeFileJson = async (
  root: string,
  paths: string[],
  content: unknown,
  ensureDirectory: boolean = true,
) => {
  const file = resolve(root, ...paths);
  if (ensureDirectory) {
    await makeDirectory(dirname(file));
  }
  await writeFile(file, jsonString(content), UTF8);
};

const removeFileAndAncestors = async (
  root: string,
  paths: string[],
): Promise<void> => {
  try {
    await rm(resolve(root, ...paths), {force: true});
    await pruneEmptyAncestors(root, arraySlice(paths, 0, -1));
  } catch {}
};

const pruneEmptyAncestors = async (root: string, paths: string[]) => {
  if (!isEmpty(paths)) {
    const directory = resolve(root, ...paths);
    if (isEmpty(await readdir(directory))) {
      await rm(directory, {recursive: true, force: true});
      await pruneEmptyAncestors(root, arraySlice(paths, 0, -1));
    }
  }
};

const getDirectoryContents = async (
  root: string,
  paths: string[],
): Promise<string[]> => {
  try {
    return await readdir(resolve(root, ...paths));
  } catch {
    return [];
  }
};

const validateDirectory = async (...paths: string[]) => {
  const directory = resolve(...paths);
  try {
    await stat(directory);
  } catch {
    try {
      await makeDirectory(directory);
    } catch {
      errorNew(CANT_MAKE + directory);
    }
  }
  if (!(await stat(directory)).isDirectory()) {
    errorNew(directory + IS_NOT + 'directory');
  }
  validateReadWrite(directory);
  return directory;
};

const validateFile = async (...paths: string[]) => {
  const file = resolve(...paths);
  const directory = dirname(file);
  try {
    await stat(file);
  } catch {
    try {
      await makeDirectory(directory);
      await writeFile(file, '');
    } catch {
      errorNew(CANT_MAKE + file);
    }
  }
  if (!(await stat(file)).isFile()) {
    errorNew(file + IS_NOT + 'file');
  }
  validateReadWrite(file);
  return file;
};
