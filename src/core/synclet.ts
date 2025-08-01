import type {
  Address,
  createSynclet as createSyncletDecl,
} from '@synclets/@types';
import type {
  ProtectedConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './protected.d.ts';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
): ProtectedSynclet => {
  let started = false;

  const getStarted = () => started;

  const start = async () => {
    await connector.connect(changed);
    await transport.connect(receive);
    started = true;
    await changed([]);
  };

  const stop = async () => {
    await connector.disconnect();
    await transport.disconnect();
    started = false;
  };

  const changed = async (address: Address) => {
    if (!started) {
      return;
    }
    await transport.send(
      JSON.stringify({
        address,
        node: await connector.getNode(address),
      }),
    );
  };

  const receive = async (message: string) => {
    if (!started) {
      return;
    }
    const {address, node} = JSON.parse(message);
    if (address && node) {
      await connector.setNode(address, node);
    }
  };

  const synclet: ProtectedSynclet = {
    __brand: 'Synclet',
    getStarted,
    start,
    stop,
    changed,
    receive,
  };

  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
