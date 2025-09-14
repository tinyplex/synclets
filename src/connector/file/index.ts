import {createConnector} from '@synclets';
import type {Address, Atom, Context, Hash, Timestamp} from '@synclets/@types';
import type {
  createFileConnector as createFileConnectorDecl,
  FileConnector,
  FileConnectorOptions,
} from '@synclets/@types/connector/file';
import {jsonParse, jsonString, UTF8, validateFile} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';

export const createFileConnector: typeof createFileConnectorDecl = async ({
  directory,
  ...options
}: FileConnectorOptions): Promise<FileConnector> => {
  const dataFile = await validateFile(directory, 'data');
  const metaFile = await validateFile(directory, 'meta');

  const connector = await createConnector(
    {
      readAtom: async (address: Address, _context: Context) =>
        jsonParse(await readFile(dataFile, UTF8)),

      readTimestamp: async (address: Address, _context: Context) =>
        jsonParse(await readFile(metaFile, UTF8)),

      readHash: async (address: Address, _context: Context) =>
        jsonParse(await readFile(metaFile, UTF8)),

      writeAtom: (address: Address, atom: Atom, _context: Context) =>
        writeFile(dataFile, jsonString(atom), UTF8),

      writeTimestamp: (
        address: Address,
        timestamp: Timestamp,
        _context: Context,
      ) => writeFile(metaFile, jsonString(timestamp), UTF8),

      writeHash: (address: Address, hash: Hash, _context: Context) =>
        writeFile(metaFile, jsonString(hash), UTF8),

      removeAtom: (address: Address, _context: Context) =>
        writeFile(dataFile, jsonString(undefined), UTF8),

      isParent: async (address: Address, _context: Context) => undefined,

      readChildIds: async (
        address: Address,
        _context: Context,
        _includeTombs?: boolean,
      ) => [],
    },
    options,
  );

  // --

  return {
    ...connector,

    getDirectory: () => directory,
  };
};
