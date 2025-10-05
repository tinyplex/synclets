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
import {objFreeze} from '../../common/object.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileDataConnector<Depth> => {
  let validatedFile: string;

  const connect = async () => {
    validatedFile = await validateFile(file);
  };

  const getInitialDataAfterConnect = (): Promise<Data | undefined> =>
    readFileJson(validatedFile, []) as Promise<Data | undefined>;

  const dataConnector = createMemoryDataConnector(
    depth,
    connect,
    undefined,
    (data: Data) => writeFileJson(validatedFile, [], data, false),
    getInitialDataAfterConnect,
  );

  const getFile = () => file;

  return objFreeze({
    ...dataConnector,
    getFile,
  });
};

export const createFileMetaConnector: typeof createFileMetaConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileMetaConnector<Depth> => {
  let validatedFile: string;

  const connect = async () => {
    validatedFile = await validateFile(file);
  };

  const getInitialMetaAfterConnect = (): Promise<Meta | undefined> =>
    readFileJson(validatedFile, []) as Promise<Meta | undefined>;

  const metaConnector = createMemoryMetaConnector(
    depth,
    connect,
    undefined,
    (meta: Meta) => writeFileJson(validatedFile, [], meta, false),
    getInitialMetaAfterConnect,
  );

  const getFile = () => file;

  return objFreeze({
    ...metaConnector,
    getFile,
  });
};
