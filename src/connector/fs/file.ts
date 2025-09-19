import type {Atom, ConnectorOptions, Hash, Timestamp} from '@synclets/@types';
import type {
  createFileConnector as createFileConnectorDecl,
  FileConnector,
} from '@synclets/@types/connector/fs';
import {createMemoryConnector} from '@synclets/connector/memory';
import {jsonString, UTF8, validateFile} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';

type Node = [Hash, SubNodes] | [Timestamp, Atom | undefined];
type SubNodes = {[id: string]: Node};

export const createFileConnector: typeof createFileConnectorDecl = async (
  atomDepth,
  file,
  options: ConnectorOptions = {},
): Promise<FileConnector> => {
  const path = await validateFile(file);

  const connector = await createMemoryConnector(
    atomDepth,
    {onWrite: () => writeFile(path, connector.getJson(), UTF8)},
    options,
  );

  const json = await readFile(path, UTF8);
  connector.setJson(
    json == ''
      ? atomDepth > 0
        ? jsonString([0, {}])
        : jsonString(['', undefined])
      : json,
  );

  // --

  return {
    ...connector,

    getFile: () => file,
  };
};
