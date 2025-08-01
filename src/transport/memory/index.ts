import {Transport} from '@synclets';
import type {MemoryTransport as MemoryTransportDecl} from '@synclets/@types/transport/memory';
import {
  getUniqueId,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapNew,
  mapSet,
} from '@synclets/utils';

const clientPools: Map<string, Map<string, MemoryTransport>> = mapNew();

export class MemoryTransport extends Transport implements MemoryTransportDecl {
  #id: string;
  #poolId: string;

  constructor(private poolId: string = 'default') {
    super();
    this.#id = getUniqueId();
    this.#poolId = poolId;
  }

  async connect(): Promise<void> {
    mapSet(mapEnsure(clientPools, this.#poolId, mapNew), this.#id, this);
  }

  async disconnect(): Promise<void> {
    mapDel(mapEnsure(clientPools, this.#poolId, mapNew), this.#id);
  }

  async send(message: string): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(this.#id, 'sent', message);
    mapForEach(mapGet(clientPools, this.#poolId), (id, transport) => {
      if (id !== this.#id) {
        transport.receive(message);
      }
    });
  }

  getClientId(): string {
    return this.#id;
  }
}
