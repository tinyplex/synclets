import {
  createTransport,
  getPacketFromParts,
  getPartsFromPacket,
} from '@synclets';
import type {Transport} from '@synclets/@types';
import type {createMemoryTransport as createMemoryTransportDecl} from '@synclets/@types/transport/memory';
import {
  mapDel,
  mapEnsure,
  mapGet,
  mapMap,
  mapNew,
  mapSet,
} from '@synclets/utils';

type Pool = Map<string, (packet: string) => Promise<void>>;

const pools: Map<string, Pool> = mapNew();

export const createMemoryTransport: typeof createMemoryTransportDecl = (
  poolId = 'default',
): Transport => {
  const pool = mapEnsure(pools, poolId, mapNew) as Pool;

  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    mapSet(pool, transport.getSyncletId(), receivePacket);
  };

  const disconnect = async (): Promise<void> => {
    mapDel(pool, transport.getSyncletId());
  };

  const sendPacket = async (packet: string): Promise<void> => {
    const [to, body] = getPartsFromPacket(packet);
    const newPacket = getPacketFromParts(transport.getSyncletId() ?? '*', body);
    if (to === '*') {
      await Promise.all(
        mapMap(pool, async (other, receive) => {
          if (other !== transport.getSyncletId()) {
            transport.log(`broadcast '${packet}' to ${other}`, 'debug');
            await receive(newPacket);
          }
        }),
      );
    } else {
      const receive = mapGet(pool, to);
      if (receive) {
        transport.log(`forward '${packet}' to ${to}`, 'debug');
        await receive(newPacket);
      }
    }
  };

  const transport = createTransport({connect, disconnect, sendPacket});
  return transport;
};
