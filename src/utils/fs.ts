import {access, constants, mkdir, stat, writeFile} from 'fs/promises';
import {dirname, resolve} from 'path';
import {arrayMap} from './array.ts';
import {errorNew} from './other.ts';

const {R_OK, W_OK} = constants;
const IS_NOT = ' is not ';
const CANT_MAKE = `Can't make `;

const makeDirectory = (directory: string) =>
  mkdir(directory, {recursive: true, mode: 0o755});

const validateReadWrite = async (path: string) => {
  try {
    await access(path, R_OK | W_OK);
  } catch {
    errorNew(`${path}${IS_NOT}read-write`);
  }
};

const encodePaths = (paths: string[]) =>
  resolve(...arrayMap(paths, encodeURIComponent));

export const validateDirectory = async (...paths: string[]) => {
  const directory = encodePaths(paths);
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
  const file = encodePaths(paths);
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
