import type {
  createTransport as createTransportDecl,
  LogLevel,
  Message,
  TransportImplementations,
  TransportOptions,
} from '@synclets/@types';
import {getUniqueId, jsonParse, jsonString} from '@synclets/utils';
import {arrayJoin, arrayMap} from '../common/array.ts';
import {mapEnsure, mapNew} from '../common/map.ts';
import {objFreeze} from '../common/object.ts';
import {errorNew, promiseAll, size} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';
import {ProtectedSynclet, ProtectedTransport} from './types.ts';

type Pending = [fragments: string[], due: number];

const RECEIVE_MESSAGE = 1;
const PACKET = /^(.+) (.+) (\d+) (\d+) (.+)$/;

export const createTransport: typeof createTransportDecl = (
  {connect, disconnect, sendPacket}: TransportImplementations,
  options: TransportOptions = {},
  extraMethods = {},
): ProtectedTransport => {
  let attachedSynclet: ProtectedSynclet<number> | undefined;

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
        await attachedSynclet?._[RECEIVE_MESSAGE]?.(
          transport,
          jsonParse(allFragments),
          from,
        );
      }
    }
  };

  // --

  const log = (message: string, level?: LogLevel) =>
    attachedSynclet?.log(message, level);

  const attach = async (synclet: ProtectedSynclet<number>) => {
    if (attachedSynclet) {
      errorNew('Transport is already attached to Synclet');
    }
    attachedSynclet = synclet;
    buffer.clear();
    await connect?.(receivePacket);
  };

  const detach = async () => {
    await disconnect?.();
    buffer.clear();
    attachedSynclet = undefined;
  };

  const sendMessage = async (
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

  const transport = objFreeze({
    _brand: 'Transport',
    log,
    _: [attach, detach, sendMessage],
    ...extraMethods,
  }) as ProtectedTransport;
  return transport;
};
