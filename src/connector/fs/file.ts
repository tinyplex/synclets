import type {Atom, ConnectorOptions, Hash, Timestamp} from '@synclets/@types';
import type {
  createFileConnector as createFileConnectorDecl,
  FileConnector,
} from '@synclets/@types/connector/fs';
import {jsonParse, jsonString} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';
import {validateFile} from '../../common/fs.ts';
import {createMemoryConnector, Root} from '../../common/memory.ts';
import {UTF8} from '../../common/string.ts';

type Node = [Hash, SubNodes] | [Timestamp, Atom | undefined];
type SubNodes = {[id: string]: Node};

export const createFileConnector: typeof createFileConnectorDecl = async (
  depth,
  file,
  options: ConnectorOptions = {},
): Promise<FileConnector> => {
  const path = await validateFile(file);

  const connector = await createMemoryConnector(
    depth,
    options,
    (root: Root) => writeFile(path, jsonString(root), UTF8),
    jsonParse(await readFile(path, UTF8)),
  );

  // --

  return {
    ...connector,

    getFile: () => file,
  };
};
