import {jsonParse, jsonString} from '@synclets/utils';
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
import {arrayMap, arrayReduce, arraySlice} from './array.ts';
import {errorNew, isEmpty} from './other.ts';
import {stringReplaceAll, UTF8} from './string.ts';
export {resolve} from 'path';

const {R_OK, W_OK} = constants;
const IS_NOT = ' is not ';
const CANT_MAKE = `Can't make `;

const EXTRA_ENCODES = [
  ['*', '%2A'],
  ['.', '%2E'],
  ['~', '%7E'],
];

export const encodePath = (path: string) =>
  arrayReduce(
    EXTRA_ENCODES,
    (str, [char, code]) => stringReplaceAll(str, char, code),
    encodeURIComponent(path),
  );

export const decodePath = (path: string) =>
  decodeURIComponent(
    arrayReduce(
      EXTRA_ENCODES,
      (str, [char, code]) => stringReplaceAll(str, code, char),
      path,
    ),
  );

export const encodePaths = (paths: string[]): string[] =>
  arrayMap(paths, encodePath);

export const decodePaths = (paths: string[]): string[] =>
  arrayMap(paths, decodePath);

const makeDirectory = (directory: string) =>
  mkdir(directory, {recursive: true, mode: 0o755});

const validateReadWrite = async (path: string) => {
  try {
    await access(path, R_OK | W_OK);
  } catch {
    errorNew(`${path}${IS_NOT}read-write`);
  }
};

export const readFileJson = async (
  root: string,
  paths: string[],
): Promise<unknown> => {
  try {
    return jsonParse(await readFile(resolve(root, ...paths), UTF8));
  } catch {}
};

export const writeFileJson = async (
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

export const removeFileAndAncestors = async (
  root: string,
  paths: string[],
): Promise<void> => {
  try {
    await rm(resolve(root, ...paths), {force: true});
    await pruneEmptyAncestors(root, arraySlice(paths, 0, -1));
  } catch {}
};

export const pruneEmptyAncestors = async (root: string, paths: string[]) => {
  if (!isEmpty(paths)) {
    const directory = resolve(root, ...paths);
    if (isEmpty(await readdir(directory))) {
      await rm(directory, {recursive: true, force: true});
      await pruneEmptyAncestors(root, arraySlice(paths, 0, -1));
    }
  }
};

export const getDirectoryContents = async (
  root: string,
  paths: string[],
): Promise<string[]> => {
  try {
    return await readdir(resolve(root, ...paths));
  } catch {
    return [];
  }
};

export const validateDirectory = async (...paths: string[]) => {
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

export const validateFile = async (...paths: string[]) => {
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
