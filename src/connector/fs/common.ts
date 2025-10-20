import type {Address, Atom, Timestamp} from '@synclets/@types';
import {encodePaths, readFileJson} from '../../common/fs.ts';

export const readLeaf = async <Leaf extends Atom | Timestamp>(
  directory: string,
  address: Address,
  isLeaf: (leaf: unknown) => leaf is Leaf | undefined,
): Promise<Leaf | undefined> => {
  const leaf = await readFileJson(directory, encodePaths(address));
  return isLeaf(leaf) ? leaf : undefined;
};
