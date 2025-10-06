import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  AnyParentAddress,
  Atom,
  Atoms,
  AtomsAddress,
  Context,
  Data,
  DataConnector,
  Meta,
  MetaConnector,
  Timestamp,
  TimestampAddress,
} from '@synclets/@types';
import {jsonParse, jsonString} from '@synclets/utils';
import {objDeepAction, objKeys} from './object.ts';
import {isEmpty} from './other.ts';

export const createMemoryDataConnector = <Depth extends number>(
  depth: Depth,
  connectImpl?: () => Promise<void>,
  disconnect?: () => Promise<void>,
  onChange?: (data: Data) => Promise<void>,
  getInitialDataAfterConnect?: () => Promise<Data | undefined>,
): DataConnector<Depth> => {
  let data: Data = {};

  const connect = async () => {
    await connectImpl?.();
    data = (await getInitialDataAfterConnect?.()) ?? data;
  };

  const readAtom = async (
    address: TimestampAddress<Depth>,
    _context: Context,
  ) =>
    objDeepAction(data, address, (parent, id) => parent[id]) as
      | Atom
      | undefined;

  const writeAtom = async (
    address: LeafAddressFor<Depth>,
    atom: Atom,
    _context: Context,
  ) =>
    await objDeepAction(
      data,
      address,
      async (parent, id) => {
        parent[id] = atom;
        await onChange?.(data);
      },
      true,
    );

  const removeAtom = async (
    address: LeafAddressFor<Depth>,
    _context: Context,
  ) =>
    await objDeepAction(
      data,
      address,
      async (parent, id) => {
        delete parent[id];
        await onChange?.(data);
      },
      true,
      true,
    );

  const readChildIds = async (
    address: AnyParentAddress<Depth>,
    _context: Context,
  ) =>
    isEmpty(address)
      ? objKeys(data)
      : (objDeepAction(data, address, (parent, id) =>
          objKeys(parent[id] as Data),
        ) ?? []);

  const readAtoms = async (address: AtomsAddress<Depth>, _context: Context) =>
    objDeepAction(
      data,
      address,
      (parent, id) => parent[id + '1'] ?? {},
    ) as Atoms;

  const getData = async () => jsonParse(jsonString(data));

  return createDataConnector<Depth>(
    depth,
    {
      connect,
      disconnect,
      readAtom,
      writeAtom,
      removeAtom,
      readChildIds,
    },
    {readAtoms, getData},
  );
};

export const createMemoryMetaConnector = <Depth extends number>(
  depth: Depth,
  connectImpl?: () => Promise<void>,
  disconnect?: () => Promise<void>,
  onChange?: (meta: Meta) => Promise<void>,
  getInitialMetaAfterConnect?: () => Promise<Meta | undefined>,
): MetaConnector<Depth> => {
  let meta: Meta = {};

  const connect = async () => {
    await connectImpl?.();
    meta = (await getInitialMetaAfterConnect?.()) ?? meta;
  };

  const readTimestamp = async (
    address: TimestampAddress<Depth>,
    _context: Context,
  ) =>
    objDeepAction(meta, address, (parent, id) => parent[id]) as
      | Timestamp
      | undefined;

  const writeTimestamp = async (
    address: TimestampAddress<Depth>,
    timestamp: Timestamp,
    _context: Context,
  ) =>
    objDeepAction(
      meta,
      address,
      (parent, id) => {
        parent[id] = timestamp;
        onChange?.(meta);
      },
      true,
      true,
    );

  const readChildIds = async (
    address: AnyParentAddress<Depth>,
    _context: Context,
  ) =>
    isEmpty(address)
      ? objKeys(meta)
      : (objDeepAction(meta, address, (parent, id) =>
          objKeys(parent[id] as Meta),
        ) ?? []);

  const readTimestamps = undefined;
  // async (
  //   address: TimestampsAddress<Depth>,
  //   _context: Context,
  // ) =>
  //   objDeepAction(
  //     meta,
  //     address,
  //     (parent, id) => parent[id] ?? {},
  //   ) as Timestamps;

  const getMeta = async () => jsonParse(jsonString(meta));

  return createMetaConnector(
    depth,
    {
      connect,
      disconnect,
      readTimestamp,
      writeTimestamp,
      readChildIds,
    },
    {readTimestamps, getMeta},
  );
};
