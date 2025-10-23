import {createMetaConnector} from '@synclets';
import type {
  AnyParentAddress,
  Meta,
  Timestamp,
  TimestampAddress,
} from '@synclets/@types';
import type {
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  createFileMetaConnector as createFileMetaConnectorDecl,
  DirectoryMetaConnector,
  FileMetaConnector,
} from '@synclets/@types/connector/fs';
import {isTimestamp} from '@synclets/utils';
import {
  decodePaths,
  encodePaths,
  getDirectoryContents,
  readFileJson,
  validateDirectory,
  validateFile,
  writeFileJson,
} from '../../common/fs.ts';
import {createMemoryConnector} from '../../common/memory.ts';
import {objFreeze} from '../../common/object.ts';
import {readLeaf} from './common.ts';

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

  const onChange = (meta: Meta) =>
    writeFileJson(validatedFile, [], meta, false);

  const getInitialMetaAfterConnect = (): Promise<Meta | undefined> =>
    readFileJson(validatedFile, []) as Promise<Meta | undefined>;

  const metaConnector = createMemoryConnector(
    true,
    depth,
    connect,
    onChange,
    getInitialMetaAfterConnect,
  );

  const getFile = () => file;

  return objFreeze({
    ...metaConnector,
    getFile,
  });
};

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryMetaConnector<Depth> => {
    let validatedDirectory: string;

    const connect = async () => {
      validatedDirectory = await validateDirectory(directory);
    };

    const readTimestamp = (
      address: TimestampAddress<Depth>,
    ): Promise<Timestamp | undefined> =>
      readLeaf(validatedDirectory, address, isTimestamp);

    const writeTimestamp = (
      address: TimestampAddress<Depth>,
      timestamp: Timestamp,
    ) => writeFileJson(validatedDirectory, encodePaths(address), timestamp);

    const readChildIds = async (address: AnyParentAddress<Depth>) =>
      decodePaths(
        await getDirectoryContents(validatedDirectory, encodePaths(address)),
      );

    const metaConnector = createMetaConnector(depth, {
      connect,
      readTimestamp,
      writeTimestamp,
      readChildIds,
    });

    const getDirectory = () => directory;

    return objFreeze({
      ...metaConnector,
      getDirectory,
    });
  };
