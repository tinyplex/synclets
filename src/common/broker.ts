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
import {ifNotUndefined, slice} from './other.ts';
import {ASTERISK, EMPTY_STRING, SPACE, strMatch, strTest} from './string.ts';

type Connection = [
  send: (packet: string) => void,
  receive: (message: ArrayBuffer | string) => void,
  del: () => void,
];

export const getBrokerFunctions = (
  path: string | null,
  brokerPaths: RegExp,
): [
  addConnection: (
    id: string,
    sendable: {send: (packet: string) => void},
    path: string,
  ) => Connection,
  getReceive: (
    id: string,
    path: string,
  ) => ((message: ArrayBuffer | string) => void) | undefined,
  clearConnections: () => void,
  getValidPath: (requestUrl: {url?: string}) => string | undefined,
] => {
  const connectionsByPath: Map<
    string,
    Map<
      string,
      [
        (packet: string) => void,
        (message: ArrayBuffer | string) => void,
        () => void,
      ]
    >
  > = mapNew();

  const add = (
    id: string,
    sendable: {send: (packet: string) => void},
    path: string,
  ): Connection => {
    const sendables = mapEnsure(
      connectionsByPath,
      path,
      mapNew<string, Connection>,
    );

    const send = (packet: string) => sendable.send(packet);

    const receive = (message: ArrayBuffer | string) => {
      const packet = message.toString();
      const splitAt = packet.indexOf(SPACE);
      if (splitAt !== -1) {
        const to = slice(packet, 0, splitAt);
        const remainder = slice(packet, splitAt + 1);
        const forwardedPacket = id + SPACE + remainder;
        if (to === ASTERISK) {
          mapForEach(sendables, (otherId, [send]) =>
            otherId !== id ? send(forwardedPacket) : 0,
          );
        } else if (to != id) {
          mapGet(sendables, to)?.[0](forwardedPacket);
        }
      }
    };

    const del = () => {
      mapDel(sendables, id);
      if (mapIsEmpty(sendables)) {
        mapDel(connectionsByPath, path);
      }
    };

    mapSet(sendables, id, [send, receive, del]);
    return [send, receive, del];
  };

  const getReceive = (id: string, path: string) =>
    mapGet(mapGet(connectionsByPath, path), id)?.[1];

  const clearConnections = () => mapClear(connectionsByPath);

  const getValidPath = ({
    url = EMPTY_STRING,
  }: {
    url?: string;
  }): string | undefined =>
    ifNotUndefined(
      strMatch(new URL(url, 'http://l').pathname ?? '/', /\/([^?]*)/),
      ([, requestPath]) =>
        requestPath === path || strTest(requestPath, brokerPaths)
          ? requestPath
          : undefined,
    );

  return [add, getReceive, clearConnections, getValidPath];
};
