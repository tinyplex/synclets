import {createTransport} from '@synclets';
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

const clientPools: Map<
  string,
  Map<string, (message: string) => Promise<void>>
> = mapNew();

export const createMemoryTransport: typeof createMemoryTransportDecl = (
  poolId = 'default',
): Transport => {
  const connect = async (
    receivePacket: (packet: string) => Promise<void>,
  ): Promise<void> => {
    mapSet(
      mapEnsure(clientPools, poolId, mapNew),
      transport.getSyncletId(),
      receivePacket,
    );
  };

  const disconnect = async (): Promise<void> => {
    mapDel(mapEnsure(clientPools, poolId, mapNew), transport.getSyncletId());
  };

  const sendPacket = async (packet: string): Promise<void> => {
    await Promise.all(
      mapMap(mapGet(clientPools, poolId), async (toClientId, receive) => {
        if (toClientId !== transport.getSyncletId()) {
          await receive(packet);
        }
      }),
    );
  };

  const transport = createTransport({connect, disconnect, sendPacket});
  return transport;
};
