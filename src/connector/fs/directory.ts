import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  Address,
  AncestorAddressFor,
  Atom,
  Atoms,
  Context,
  LeafAddressFor,
  ParentAddressFor,
  Timestamp,
  Timestamps,
} from '@synclets/@types';
import type {
  createDirectoryDataConnector as createDirectoryDataConnectorDecl,
  createDirectoryMetaConnector as createDirectoryMetaConnectorDecl,
  DirectoryDataConnector,
  DirectoryMetaConnector,
} from '@synclets/@types/connector/fs';
import {jsonParse, jsonString} from '@synclets/utils';
import {arrayMap} from '../../common/array.ts';
import {
  getDirectoryContents,
  readPossibleFile,
  removePossibleFile,
  validateDirectory,
  writeEnsuredFile,
} from '../../common/fs.ts';
import {objFromEntries} from '../../common/object.ts';
import {promiseAll} from '../../common/other.ts';
import {isAtom, isTimestamp} from '../../core/types.ts';

export const createDirectoryDataConnector: typeof createDirectoryDataConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryDataConnector<Depth>> => {
    type AtomAddress = LeafAddressFor<Depth>;
    type ParentAddress = ParentAddressFor<Depth>;
    type AncestorAddress = AncestorAddressFor<Depth>;

    const directory = await validateDirectory(path);

    const readAtom = async (
      address: AtomAddress,
    ): Promise<Atom | undefined> => {
      try {
        const leaf = jsonParse(await readPossibleFile(directory, address));
        if (isAtom(leaf)) {
          return leaf;
        }
      } catch {}
      return undefined;
    };

    const writeAtom = (address: AtomAddress, atom: Atom, _context: Context) =>
      writeEnsuredFile(directory, address, jsonString(atom));

    const removeAtom = (address: AtomAddress, _context: Context) =>
      removePossibleFile(directory, address);

    const readChildIds = (address: AncestorAddress, _context: Context) =>
      getDirectoryContents(directory, address);

    const readAtoms = async (
      address: ParentAddress,
      _context: Context,
    ): Promise<Atoms> =>
      objFromEntries(
        await promiseAll(
          arrayMap(
            await getDirectoryContents(directory, address),
            async (id) => [
              id,
              await readPossibleFile(directory, [...(address as Address), id]),
            ],
          ),
        ),
      );

    const dataConnector = await createDataConnector(depth, {
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
      readAtoms,
    });

    return {
      ...dataConnector,
      getDirectory: () => directory,
    };
  };

export const createDirectoryMetaConnector: typeof createDirectoryMetaConnectorDecl =
  async <Depth extends number>(
    depth: Depth,
    path: string,
  ): Promise<DirectoryMetaConnector<Depth>> => {
    type TimestampAddress = LeafAddressFor<Depth>;
    type ParentAddress = ParentAddressFor<Depth>;
    type AncestorAddress = AncestorAddressFor<Depth>;

    const directory = await validateDirectory(path);

    const readTimestamp = async (
      address: TimestampAddress,
      _context: Context,
    ): Promise<Timestamp | undefined> => {
      try {
        const leaf = jsonParse(await readPossibleFile(directory, address));
        if (isTimestamp(leaf)) {
          return leaf;
        }
      } catch {}
      return undefined;
    };

    const writeTimestamp = async (
      address: TimestampAddress,
      timestamp: Timestamp,
      _context: Context,
    ) => writeEnsuredFile(directory, address, jsonString(timestamp));

    const readChildIds = async (address: AncestorAddress, _context: Context) =>
      getDirectoryContents(directory, address);

    const readTimestamps = async (
      address: ParentAddress,
      _context: Context,
    ): Promise<Timestamps> =>
      objFromEntries(
        await promiseAll(
          arrayMap(
            await getDirectoryContents(directory, address),
            async (id) => [
              id,
              await readPossibleFile(directory, [...(address as Address), id]),
            ],
          ),
        ),
      );

    const metaConnector = await createMetaConnector(depth, {
      readTimestamp,
      writeTimestamp,
      readChildIds,
      readTimestamps,
    });

    return {
      ...metaConnector,
      getDirectory: () => directory,
    };
  };
