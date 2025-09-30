import type {Data} from '@synclets/@types';
import type {
  createFileDataConnector as createFileDataConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {jsonParse, jsonString} from '@synclets/utils';
import {readFile, writeFile} from 'fs/promises';
import {validateFile} from '../../common/fs.ts';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
  Root,
} from '../../common/memory.ts';
import {UTF8} from '../../common/string.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl =
  async (depth, file): Promise<FileDataConnector> => {
    const path = await validateFile(file);

    const dataConnector = await createMemoryDataConnector(
      depth,
      (data: Data) => writeFile(path, jsonString(data), UTF8),
      jsonParse(await readFile(path, UTF8)),
    );

    // --

    return {
      ...dataConnector,

      getFile: () => file,
    };
  };

export const createFileMetaConnector: typeof createFileMetaConnectorDecl =
  async (depth, file): Promise<FileMetaConnector> => {
    const path = await validateFile(file);

    const metaConnector = await createMemoryMetaConnector(
      depth,
      (root: Root) => writeFile(path, jsonString(root), UTF8),
      jsonParse(await readFile(path, UTF8)),
    );

    // --

    return {
      ...metaConnector,

      getFile: () => file,
    };
  };
