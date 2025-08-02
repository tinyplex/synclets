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
    receive: (message: string) => Promise<void>,
  ): Promise<void> => {
    mapSet(
      mapEnsure(clientPools, poolId, mapNew),
      transport.getSyncletId(),
      receive,
    );
  };

  const disconnect = async (): Promise<void> => {
    mapDel(mapEnsure(clientPools, poolId, mapNew), transport.getSyncletId());
  };

  const send = async (message: string): Promise<void> => {
    mapForEach(mapGet(clientPools, poolId), (clientId, receive) => {
      if (clientId !== transport.getSyncletId()) {
        receive(message);
      }
    });
  };

  const transport = createTransport({connect, disconnect, send});
  return transport;
};
