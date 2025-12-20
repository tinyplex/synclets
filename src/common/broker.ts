import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapIsEmpty,
  mapNew,
  mapSet,
} from './map.ts';
import {slice} from './other.ts';
import {ASTERISK, SPACE} from './string.ts';

type Sendable = {send: (packet: string) => void};

export const getBrokerFunctions = (): [
  addConnection: (
    id: string,
    sendable: Sendable,
    path: string,
  ) => [receivePacket: (packet: string) => void, close: () => void],
  clearConnections: () => void,
] => {
  const sendablesByPath: Map<string, Map<string, Sendable>> = mapNew();

  const addConnection = (
    id: string,
    sendable: Sendable,
    path: string,
  ): [(packet: string) => void, () => void] => {
    const sendables = mapEnsure(
      sendablesByPath,
      path,
      mapNew<string, Sendable>,
    );
    mapSet(sendables, id, sendable);

    const receivePacket = (packet: string) => {
      const splitAt = packet.indexOf(SPACE);
      if (splitAt !== -1) {
        const to = slice(packet, 0, splitAt);
        const remainder = slice(packet, splitAt + 1);
        const forwardedPacket = id + SPACE + remainder;
        if (to === ASTERISK) {
          mapForEach(sendables, (otherId, otherSendable) =>
            otherId !== id ? otherSendable.send(forwardedPacket) : 0,
          );
        } else if (to != id) {
          mapGet(sendables, to)?.send(forwardedPacket);
        }
      }
    };

    const close = () => {
      mapDel(sendables, id);
      if (mapIsEmpty(sendables)) {
        mapDel(sendablesByPath, path);
      }
    };

    return [receivePacket, close];
  };

  const clearConnections = () => mapClear(sendablesByPath);

  return [addConnection, clearConnections];
};
