import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapIsEmpty,
  mapNew,
  mapSet,
} from '../common/map.ts';
import {slice} from '../common/other.ts';
import {ASTERISK, SPACE} from '../common/string.ts';

export const getConnectionFunctions = (): [
  addConnection: (
    id: string,
    send: (packet: string) => void,
    path: string,
  ) => [receivePacket: (packet: string) => void, close: () => void],
  clearConnections: () => void,
] => {
  const sendsByPath: Map<
    string,
    Map<string, (packet: string) => void>
  > = mapNew();

  const addConnection = (
    id: string,
    send: (packet: string) => void,
    path: string,
  ): [(packet: string) => void, () => void] => {
    const sends = mapEnsure(
      sendsByPath,
      path,
      mapNew<string, (packet: string) => void>,
    );
    mapSet(sends, id, send);

    const receivePacket = (packet: string) => {
      const splitAt = packet.indexOf(SPACE);
      if (splitAt !== -1) {
        const to = slice(packet, 0, splitAt);
        const remainder = slice(packet, splitAt + 1);
        const forwardedPacket = id + SPACE + remainder;
        if (to === ASTERISK) {
          mapForEach(sends, (otherId, otherSend) =>
            otherId !== id ? otherSend(forwardedPacket) : 0,
          );
        } else if (to != id) {
          mapGet(sends, to)?.(forwardedPacket);
        }
      }
    };

    const close = () => {
      mapDel(sends, id);
      if (mapIsEmpty(sends)) {
        mapDel(sendsByPath, path);
      }
    };

    return [receivePacket, close];
  };

  const clearConnections = () => mapClear(sendsByPath);

  return [addConnection, clearConnections];
};
