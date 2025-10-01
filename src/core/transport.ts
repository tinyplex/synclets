import type {
  createTransport as createTransportDecl,
  LogLevel,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {getUniqueId, jsonParse, jsonString} from '@synclets/utils';
import {arrayJoin, arrayMap} from '../common/array.ts';
import {mapEnsure, mapNew} from '../common/map.ts';
import {errorNew, promiseAll, size} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';
import {
  Message,
  ProtectedSynclet,
  ProtectedTransport,
  ReceiveMessage,
} from './types.js';

type Pending = [fragments: string[], due: number];

const PACKET = /^(.+) (.+) (\d+) (\d+) (.+)$/;

export const createTransport: typeof createTransportDecl = async (
  {connect, disconnect, sendPacket}: TransportImplementations,
  options: TransportOptions = {},
): Promise<ProtectedTransport> => {
  let connected = false;
  let attachedSynclet: ProtectedSynclet<number> | undefined;
  let receiveFinalMessage: ReceiveMessage | undefined;

  const messageSplit = new RegExp(
    `(.{1,${options.fragmentSize ?? 4096}})`,
    'g',
  );

  const buffer: Map<string, Pending> = mapNew();

  const receivePacket = async (packet: string) => {
    const [, from, messageId, indexStr, totalStr, fragment] =
      packet.match(PACKET) ?? [];
    if (messageId) {
      const index = parseInt(indexStr);
      const total = parseInt(totalStr);

      const pending = mapEnsure(
        buffer,
        from + ' ' + messageId,
        (): Pending => [[], total],
      );
      const [fragments] = pending;

      if (fragments[index] == null) {
        fragments[index] = fragment;
        pending[1]--;
      }

      if (pending[1] === 0) {
        buffer.delete(messageId);
        const allFragments = arrayJoin(fragments);
        log(
          `recv: ${messageId} '${allFragments}', ${total} packets from ${from}`,
          'debug',
        );
        await receiveFinalMessage?.(jsonParse(allFragments), from);
      }
    }
  };

  const sendPackets = async (
    message: Message,
    to: string = ASTERISK,
  ): Promise<void> => {
    if (sendPacket) {
      const messageId = getUniqueId();
      const allFragments = jsonString(message);
      const fragments = allFragments.match(messageSplit) ?? [];
      const total = size(fragments);
      log(
        `send: ${messageId} '${allFragments}', ${total} packets to ${to}`,
        'debug',
      );
      await promiseAll(
        arrayMap(fragments, (fragment, index) =>
          sendPacket(arrayJoin([to, messageId, index, total, fragment], SPACE)),
        ),
      );
    }
  };

  // --

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = (synclet: ProtectedSynclet<number>) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet');
    }
    attachedSynclet = synclet;
  };

  const detach = () => {
    attachedSynclet = undefined;
  };

  const connectImpl = async (receiveMessage: ReceiveMessage) => {
    if (!connected) {
      buffer.clear();
      receiveFinalMessage = receiveMessage;
      await connect?.(receivePacket);
      connected = true;
    }
  };

  const disconnectImpl = async () => {
    if (connected) {
      buffer.clear();
      receiveFinalMessage = undefined;
      await disconnect?.();
      connected = false;
    }
  };

  const sendMessage = async (message: Message, to?: string) => {
    if (connected) {
      await sendPackets(message, to);
    }
  };

  return {
    _brand: 'Transport',
    log,
    _: [attach, detach, connectImpl, disconnectImpl, sendMessage],
  };
};
