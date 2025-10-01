import type {Data, Meta} from '@synclets/@types';
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
} from '../../common/memory.ts';
import {UTF8} from '../../common/string.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<FileDataConnector<Depth>> => {
    const file = await validateFile(path);

    const dataConnector = await createMemoryDataConnector(
      depth,
      (data: Data) => writeFile(file, jsonString(data), UTF8),
      jsonParse(await readFile(file, UTF8)),
    );

    const getFile = () => file;

    return {
      ...dataConnector,
      getFile,
    };
  };

export const createFileMetaConnector: typeof createFileMetaConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<FileMetaConnector<Depth>> => {
    const file = await validateFile(path);

    const metaConnector = await createMemoryMetaConnector(
      depth,
      (meta: Meta) => writeFile(file, jsonString(meta), UTF8),
      jsonParse(await readFile(file, UTF8)),
    );

    const getFile = () => file;

    return {
      ...metaConnector,
      getFile,
    };
  };
