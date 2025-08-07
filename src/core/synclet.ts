import type {
  Address,
  createSynclet as createSyncletDecl,
  LogLevel,
  Synclet,
  SyncletOptions,
} from '@synclets/@types';
import {getUniqueId} from '@synclets/utils';
import {encodeGiveNode, encodeHaveNode, MessageType} from './message.ts';
import type {
  Message,
  ProtectedConnector,
  ProtectedTransport,
} from './protected.d.ts';
import {getQueue} from './queue.ts';

export const createSynclet: typeof createSyncletDecl = ((
  connector: ProtectedConnector,
  transport: ProtectedTransport,
  options: SyncletOptions = {},
): Synclet => {
  let started = false;

  const id = options.id ?? getUniqueId();
  const logger = options.logger ?? {};
  const queue = getQueue();

  const queueIfStarted = async (actions: () => Promise<void>) => {
    if (started) {
      await queue(actions);
    }
  };

  const receiveMessage = (message: Message, from: string) =>
    queueIfStarted(async () => {
      if (from !== '*' && from !== id) {
        const [type, address] = message;
        switch (type) {
          case MessageType.HaveNode: {
            log(`recv HaveNode '${address}' from ${from}`);
            const [, , timestamp] = message;
            const myTimestamp = await connector.getTimestamp(address);
            if (timestamp > myTimestamp) {
              log(`send HaveNode '${address}' to ${from}`);
              await sendMessage(encodeHaveNode(address, myTimestamp), from);
            } else if (timestamp < myTimestamp) {
              log(`send GiveNode '${address}' to ${from}`);
              const myValue = await connector.get(address);
              await sendMessage(
                encodeGiveNode(address, myTimestamp, myValue),
                from,
              );
            }
            break;
          }
          case MessageType.GiveNode: {
            const [, , timestamp, value] = message;
            log(`recv GiveNode '${address}' from ${from}`);
            if (timestamp > (await connector.getTimestamp(address))) {
              log(`set '${address}' from ${from}`);
              await connector.set(address, value);
              await connector.setTimestamp(address, timestamp);
            }
            break;
          }
        }
      }
    });

  const sendMessage = (message: Message, to?: string) =>
    queueIfStarted(async () => {
      await transport.sendMessage(message, to);
    });

  // #region protected

  const sync = (address: Address) =>
    queueIfStarted(async () => {
      log(`sync: '${address}'`);
      await sendMessage(
        encodeHaveNode(address, await connector.getTimestamp(address)),
      );
    });

  // #endregion

  // #region public

  const getId = () => id;

  const getStarted = () => started;

  const start = async () => {
    log('start');
    await connector.connect(sync);
    await transport.connect(receiveMessage);
    started = true;
    await sync('');
  };

  const stop = async () => {
    log('stop');
    await connector.disconnect();
    await transport.disconnect();
    started = false;
  };

  const log = (string: string, level: LogLevel = 'info') =>
    logger?.[level]?.(`[${id}] ${string}`);

  // #endregion

  const synclet: Synclet = {
    __brand: 'Synclet',

    getId,
    getStarted,
    start,
    stop,
    log,
  };

  log('createSynclet');
  connector.attachToSynclet(synclet);
  transport.attachToSynclet(synclet);
  return synclet;
}) as any;
