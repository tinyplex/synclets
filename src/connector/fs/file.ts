import type {Data, Meta} from '@synclets/@types';
import type {
  createFileDataConnector as createFileDataConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  FileDataConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {readFileJson, validateFile, writeFileJson} from '../../common/fs.ts';
import {
  createMemoryDataConnector,
  createMemoryMetaConnector,
} from '../../common/memory.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<FileDataConnector<Depth>> => {
    const file = await validateFile(path);

    const dataConnector = await createMemoryDataConnector(
      depth,
      (data: Data) => writeFileJson(file, [], data, false),
      (await readFileJson(file, [])) as Data | undefined,
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
      (meta: Meta) => writeFileJson(file, [], meta, false),
      (await readFileJson(file, [])) as Meta | undefined,
    );

    const getFile = () => file;

    return {
      ...metaConnector,
      getFile,
    };
  };
