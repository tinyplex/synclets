import {createTransport} from '@synclets';
import type {Transport} from '@synclets/@types';
import type {createMemoryTransport as createMemoryTransportDecl} from '@synclets/@types/transport/memory';
import {
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
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

  const sendPacket = async (packet: string): Promise<void> =>
    mapForEach(mapGet(clientPools, poolId), (clientId, receive) => {
      if (clientId !== transport.getSyncletId()) {
        receive(packet);
      }
    });

  const transport = createTransport({connect, disconnect, sendPacket});
  return transport;
};
