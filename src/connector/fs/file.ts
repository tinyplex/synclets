import type {Atom, ConnectorOptions, Hash, Timestamp} from '@synclets/@types';
import type {
  createFileConnector as createFileConnectorDecl,
  FileConnector,
} from '@synclets/@types/connector/fs';
import {
  createMemoryConnector,
  ProtectedMemoryConnector,
} from '@synclets/connector/memory';
import {readFile, writeFile} from 'fs/promises';
import {validateFile} from '../../common/fs.ts';
import {UTF8} from '../../common/string.ts';

type Node = [Hash, SubNodes] | [Timestamp, Atom | undefined];
type SubNodes = {[id: string]: Node};

export const createFileConnector: typeof createFileConnectorDecl = async (
  atomDepth,
  file,
  options: ConnectorOptions = {},
): Promise<FileConnector> => {
  const path = await validateFile(file);

  const connector = (await createMemoryConnector(
    atomDepth,
    {onWrite: () => writeFile(path, connector._getJson(), UTF8)},
    options,
  )) as ProtectedMemoryConnector;

  connector._setJson(await readFile(path, UTF8));

  // --

  return {
    ...connector,

    getFile: () => file,
  };
};
