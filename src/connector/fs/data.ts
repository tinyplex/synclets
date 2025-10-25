import {createDataConnector} from '@synclets';
import type {AnyParentAddress, Atom, AtomAddress} from '@synclets/@types';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createFileDataConnector as createFileDataConnectorDecl,
  DirectoryDataConnector,
  FileDataConnector,
} from '@synclets/@types/connector/fs';
import {isAtom} from '@synclets/utils';
import {
  decodePaths,
  encodePaths,
  getDirectoryContents,
  removeFileAndAncestors,
  validateDirectory,
  writeFileJson,
} from '../../common/fs.ts';
import {objFreeze} from '../../common/object.ts';
import {createFileConnector, readLeaf} from './common.ts';

export const createFileDataConnector: typeof createFileDataConnectorDecl = <
  Depth extends number,
>(
  depth: Depth,
  file: string,
): FileDataConnector<Depth> => createFileConnector(false, depth, file);

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  <Depth extends number>(
    depth: Depth,
    directory: string,
  ): DirectoryDataConnector<Depth> => {
    let validatedDirectory: string;

    const connect = async () => {
      validatedDirectory = await validateDirectory(directory);
    };

    const readAtom = (address: AtomAddress<Depth>): Promise<Atom | undefined> =>
      readLeaf(validatedDirectory, address, isAtom);

    const writeAtom = (address: AtomAddress<Depth>, atom: Atom) =>
      writeFileJson(validatedDirectory, encodePaths(address), atom);

    const removeAtom = (address: AtomAddress<Depth>) =>
      removeFileAndAncestors(validatedDirectory, encodePaths(address));

    const readChildIds = async (address: AnyParentAddress<Depth>) =>
      decodePaths(
        await getDirectoryContents(validatedDirectory, encodePaths(address)),
      );

    const dataConnector = createDataConnector(depth, {
      connect,
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
    });

    const getDirectory = () => directory;

    return objFreeze({
      ...dataConnector,
      getDirectory,
    });
  };
