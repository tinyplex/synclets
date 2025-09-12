import type {
  Atom,
  ConnectorOptions,
  Context,
  Timestamp,
} from '@synclets/@types';
import type {
  createFileValueConnector as createFileValueConnectorDecl,
  FileValueConnector,
} from '@synclets/@types/connector/file';
import {createBaseValueConnector} from '@synclets/connector/base';
import {jsonParse, jsonStringify, UTF8, validateFile} from '@synclets/utils';
import {readFile, unlink, watch, writeFile} from 'fs/promises';

export const createFileValueConnector: typeof createFileValueConnectorDecl =
  async (
    directory: string,
    options?: ConnectorOptions,
  ): Promise<FileValueConnector> => {
    let controller: AbortController | undefined;

    const dataFile = await validateFile(directory, 'data');
    const metaFile = await validateFile(directory, 'meta');

    const connector = await createBaseValueConnector(
      {
        connect: async (sync?: () => Promise<void>) => {
          if (sync) {
            controller = new AbortController();
            for await (const _ of watch(metaFile, {
              signal: controller.signal,
            })) {
              await sync();
            }
          }
        },

        disconnect: async () => {
          controller?.abort();
          controller = undefined;
        },

        readValueAtom: async (_context: Context) =>
          jsonParse(await readFile(dataFile, UTF8)),

        readValueTimestamp: async (_context: Context) =>
          jsonParse(await readFile(metaFile, UTF8)),

        writeValueAtom: (atom: Atom, _context: Context) =>
          writeFile(dataFile, jsonStringify(atom), UTF8),

        writeValueTimestamp: (timestamp: Timestamp, _context: Context) =>
          writeFile(metaFile, jsonStringify(timestamp), UTF8),

        removeValueAtom: (_context: Context) => unlink(dataFile),
      },
      options,
    );

    // --

    return {
      ...connector,

      getDirectory: () => directory,
    };
  };
