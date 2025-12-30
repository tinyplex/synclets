import {getUniqueId} from '@synclets/utils';
import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapIsEmpty,
  mapKeys,
  mapNew,
  mapSet,
} from './map.ts';
import {ifNotUndefined, slice} from './other.ts';
import {ASTERISK, EMPTY_STRING, SPACE, strMatch, strTest} from './string.ts';

type Sendable = {send: (packet: string) => void};
type Connection = [
  id: string,
  send: (packet: string) => void,
  receive: (message: ArrayBuffer | string) => void,
  del: () => void,
];

export const getConnectionFunctions = (
  path: string | null,
  brokerPaths: RegExp,
): [
  createConnection: (sendable: Sendable, path: string) => Connection,
  getReceive: (
    path: string,
    id: string,
  ) => ((message: ArrayBuffer | string) => void) | undefined,
  getDel: (path: string, id: string) => (() => void) | undefined,
  clearConnections: () => void,
  getValidPath: (requestUrl: {url?: string}) => string | undefined,
  getPaths: () => string[],
  getClientIds: (path: string) => string[],
] => {
  const connectionsBySendable: Map<Sendable, Connection> = mapNew();
  const connectionsByPath: Map<string, Map<string, Connection>> = mapNew();

  const addConnection = (sendable: Sendable, path: string): Connection =>
    ifNotUndefined(
      mapGet(connectionsBySendable, sendable),
      (existingConnection) => existingConnection,
      () => {
        const id = getUniqueId();
        const connectionsForPath = mapEnsure(
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
              mapForEach(connectionsForPath, (otherId, [, send]) =>
                otherId !== id ? send(forwardedPacket) : 0,
              );
            } else if (to != id) {
              mapGet(connectionsForPath, to)?.[1](forwardedPacket);
            }
          }
        };

        const del = () => {
          mapDel(connectionsBySendable, sendable);
          mapDel(connectionsForPath, id);
          if (mapIsEmpty(connectionsForPath)) {
            mapDel(connectionsByPath, path);
          }
        };

        const connection: Connection = [id, send, receive, del];

        connectionsBySendable.set(sendable, connection);
        mapSet(connectionsForPath, id, connection);

        return connection;
      },
    ) as Connection;

  const getReceive = (path: string, id: string) =>
    mapGet(mapGet(connectionsByPath, path), id)?.[2];

  const getDel = (path: string, id: string) =>
    mapGet(mapGet(connectionsByPath, path), id)?.[3];

  const clearConnections = () => {
    mapClear(connectionsByPath);
    mapClear(connectionsBySendable);
  };

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

  const getPaths = (): string[] => mapKeys(connectionsByPath);

  const getClientIds = (path: string): string[] =>
    mapKeys(mapGet(connectionsByPath, path)) ?? [];

  return [
    addConnection,
    getReceive,
    getDel,
    clearConnections,
    getValidPath,
    getPaths,
    getClientIds,
  ];
};
