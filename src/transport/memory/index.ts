import type {MemoryTransport as MemoryTransportDecl} from '../../@types/transport/memory/index.d.ts';
import {
  getUniqueId,
  mapDel,
  mapEnsure,
  mapNew,
  mapSet,
} from '../../common/index.ts';
import {Transport} from '../../index.ts';

const clientPools: Map<string, Map<string, MemoryTransport>> = mapNew();

export class MemoryTransport extends Transport implements MemoryTransportDecl {
  #clientId: string;
  #poolId: string;

  constructor(private poolId: string = 'default') {
    super();
    this.#clientId = getUniqueId();
    this.#poolId = poolId;
  }

  foo(): string {
    return 'FOO';
  }

  async connect(): Promise<void> {
    mapSet(mapEnsure(clientPools, this.#poolId, mapNew), this.#clientId, this);
  }

  async disconnect(): Promise<void> {
    mapDel(mapEnsure(clientPools, this.#poolId, mapNew), this.#clientId);
  }

  async send(): Promise<void> {}

  async receive(): Promise<any> {}

  getClientId(): string {
    return this.#clientId;
  }
}
