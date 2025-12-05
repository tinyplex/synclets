import type {Data, Meta} from '@synclets/@types';
import {
  LocalStorageDataConnector,
  LocalStorageMetaConnector,
  SessionStorageDataConnector,
  SessionStorageMetaConnector,
} from '@synclets/@types/browser';
import {jsonParse, jsonString} from '@synclets/utils';
import {createMemoryConnector} from '../common/memory.ts';

export const createStorageConnector = <
  CreateLocal extends boolean,
  CreateMeta extends boolean,
  Depth extends number,
>(
  createLocal: CreateLocal,
  createMeta: CreateMeta,
  depth: Depth,
  storageName: string,
) => {
  const storage = globalThis[createLocal ? 'localStorage' : 'sessionStorage'];

  const onChange = async (tree: CreateMeta extends true ? Meta : Data) =>
    storage.setItem(storageName, jsonString(tree));

  const getInitialAfterConnect = () => {
    try {
      return jsonParse(storage.getItem(storageName) ?? '');
    } catch {}
  };

  const extraFunctions = {
    getStorageName: () => storageName,
  };

  return createMemoryConnector(
    createMeta,
    depth,
    undefined,
    onChange,
    getInitialAfterConnect,
    extraFunctions,
  ) as CreateLocal extends true
    ? CreateMeta extends true
      ? LocalStorageMetaConnector<Depth>
      : LocalStorageDataConnector<Depth>
    : CreateMeta extends true
      ? SessionStorageMetaConnector<Depth>
      : SessionStorageDataConnector<Depth>;
};
