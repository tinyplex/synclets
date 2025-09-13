import type {Atom, Context, Timestamp} from '@synclets/@types';
import type {
  createFileValueConnector as createFileValueConnectorDecl,
  FileConnectorOptions,
  FileValueConnector,
} from '@synclets/@types/connector/file';
import {createBaseValueConnector} from '@synclets/connector/base';
import {jsonParse, jsonString, UTF8, validateFile} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';

export const createFileValueConnector: typeof createFileValueConnectorDecl =
  async ({
    directory,
    ...options
  }: FileConnectorOptions): Promise<FileValueConnector> => {
    const dataFile = await validateFile(directory, 'data');
    const metaFile = await validateFile(directory, 'meta');

    const connector = await createBaseValueConnector(
      {
        readValueAtom: async (_context: Context) =>
          jsonParse(await readFile(dataFile, UTF8)),

        readValueTimestamp: async (_context: Context) =>
          jsonParse(await readFile(metaFile, UTF8)),

        writeValueAtom: (atom: Atom, _context: Context) =>
          writeFile(dataFile, jsonString(atom), UTF8),

        writeValueTimestamp: (timestamp: Timestamp, _context: Context) =>
          writeFile(metaFile, jsonString(timestamp), UTF8),

        removeValueAtom: (_context: Context) =>
          writeFile(dataFile, jsonString(undefined), UTF8),
      },
      options,
    );

    // --

    return {
      ...connector,

      getDirectory: () => directory,
    };
  };
