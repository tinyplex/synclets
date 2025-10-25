import {createDataConnector, createMetaConnector} from '@synclets';
import type {
  AnyParentAddress,
  Atom,
  AtomAddress,
  AtomsAddress,
  Data,
  DataConnector,
  DataConnectorImplementations,
  DataConnectorOptimizations,
  ExtraFunctions,
  Meta,
  MetaConnector,
  MetaConnectorImplementations,
  MetaConnectorOptimizations,
  Timestamp,
  TimestampAddress,
  TimestampsAddress,
} from '@synclets/@types';
import {jsonParse, jsonString} from '@synclets/utils';
import {objDeepAction, objKeys} from './object.ts';
import {isEmpty} from './other.ts';

export const createMemoryConnector = <
  CreateMeta extends boolean,
  Depth extends number,
>(
  createMeta: CreateMeta,
  depth: Depth,
  connectImpl?: () => Promise<void>,
  onChange?: (tree: CreateMeta extends true ? Meta : Data) => Promise<void>,
  getInitialAfterConnect?: () => Promise<
    (CreateMeta extends true ? Meta : Data) | undefined
  >,
  extraFunctions: ExtraFunctions = {},
) => {
  let tree: Data | Meta = {};

  const connect = async () => {
    await connectImpl?.();
    tree = (await getInitialAfterConnect?.()) ?? tree;
  };

  const readLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
  ) => objDeepAction(tree, address, (parent, id) => parent[id]);

  const writeLeaf = async (
    address: AtomAddress<Depth> | TimestampAddress<Depth>,
    leaf: Atom | Timestamp,
  ) => {
    await objDeepAction(
      tree,
      address,
      async (parent, id) => {
        parent[id] = leaf;
        await onChange?.(tree as CreateMeta extends true ? Meta : Data);
      },
      true,
    );
  };

  const removeAtom = async (address: AtomAddress<Depth>) => {
    await objDeepAction(
      tree,
      address,
      async (parent, id) => {
        delete parent[id];
        await onChange?.(tree as CreateMeta extends true ? Meta : Data);
      },
      true,
      true,
    );
  };

  const readChildIds = async (address: AnyParentAddress<Depth>) =>
    isEmpty(address)
      ? objKeys(tree)
      : (objDeepAction(tree, address, (parent, id) =>
          objKeys(parent[id] as Meta | Data),
        ) ?? []);

  const readLeaves = async (
    address: AtomsAddress<Depth> | TimestampsAddress<Depth>,
  ) => objDeepAction(tree, address, (parent, id) => parent[id] ?? {});

  const getTree = async () => jsonParse(jsonString(tree));

  const connector = createMeta
    ? createMetaConnector(
        depth,
        {
          connect,
          readTimestamp:
            readLeaf as MetaConnectorImplementations<Depth>['readTimestamp'],
          writeTimestamp: writeLeaf,
          readChildIds,
        },
        {
          readTimestamps:
            readLeaves as MetaConnectorOptimizations<Depth>['readTimestamps'],
          getMeta: getTree,
        },
        extraFunctions,
      )
    : createDataConnector(
        depth,
        {
          connect,
          readAtom: readLeaf as DataConnectorImplementations<Depth>['readAtom'],
          writeAtom: writeLeaf,
          removeAtom: removeAtom,
          readChildIds,
        },
        {
          readAtoms:
            readLeaves as DataConnectorOptimizations<Depth>['readAtoms'],
          getData: getTree,
        },
        extraFunctions,
      );

  return connector as CreateMeta extends true
    ? MetaConnector<Depth>
    : DataConnector<Depth>;
};
