import {
  createTransport,
  getPacketFromParts,
  getPartsFromPacket,
} from '@synclets';
import type {Transport, TransportOptions} from '@synclets/@types';
import type {createMemoryTransport as createMemoryTransportDecl} from '@synclets/@types/transport/memory';
import {getUniqueId} from '@synclets/utils';
import {
  mapDel,
  mapEnsure,
  mapGet,
  mapMap,
  mapNew,
  mapSet,
} from '../../common/map.ts';
import {promiseAll} from '../../common/other.ts';
import {ASTERISK} from '../../common/string.ts';

type Pool = Map<string, (packet: string) => Promise<void>>;

const pools: Map<string, Pool> = mapNew();

export const createMemoryTransport: typeof createMemoryTransportDecl = (
  options: TransportOptions & {poolId?: string} = {},
): Promise<Transport> => {
  const id = getUniqueId();
  const pool = mapEnsure(pools, options.poolId ?? 'default', mapNew) as Pool;

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    mapSet(pool, id, receivePacket);
  };

  const disconnect = async (): Promise<void> => {
    mapDel(pool, id);
  };

  const sendPacket = async (packet: string): Promise<void> => {
    const [to, body] = getPartsFromPacket(packet);
    const newPacket = getPacketFromParts(id ?? ASTERISK, body);
    if (to === ASTERISK) {
      await promiseAll(
        mapMap(pool, async (otherId, receive) => {
          if (otherId !== id) {
            await receive(newPacket);
          }
        }),
      );
    } else {
      const receive = mapGet(pool, to);
      if (receive) {
        await receive(newPacket);
      }
    }
  };

  return createTransport({connect, disconnect, sendPacket}, options);
};
