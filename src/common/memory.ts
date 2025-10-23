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

type Tree = Data | Meta;
type Leaf = Atom | Timestamp;

type LeafAddress<Depth extends number> =
  | AtomAddress<Depth>
  | TimestampAddress<Depth>;
type LeavesAddress<Depth extends number> =
  | AtomsAddress<Depth>
  | TimestampsAddress<Depth>;

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
) => {
  let tree: Tree = {};

  const connect = async () => {
    await connectImpl?.();
    tree = (await getInitialAfterConnect?.()) ?? tree;
  };

  const readLeaf = async (address: LeafAddress<Depth>) =>
    objDeepAction(tree, address, (parent, id) => parent[id]);

  const writeLeaf = async (address: LeafAddress<Depth>, leaf: Leaf) => {
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

  const removeLeaf = async (address: LeafAddress<Depth>) => {
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
          objKeys(parent[id] as Tree),
        ) ?? []);

  const readLeaves = async (address: LeavesAddress<Depth>) =>
    objDeepAction(tree, address, (parent, id) => parent[id] ?? {});

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
      )
    : createDataConnector(
        depth,
        {
          connect,
          readAtom: readLeaf as DataConnectorImplementations<Depth>['readAtom'],
          writeAtom: writeLeaf,
          removeAtom: removeLeaf,
          readChildIds,
        },
        {
          readAtoms:
            readLeaves as DataConnectorOptimizations<Depth>['readAtoms'],
          getData: getTree,
        },
      );

  return connector as CreateMeta extends true
    ? MetaConnector<Depth>
    : DataConnector<Depth>;
};
