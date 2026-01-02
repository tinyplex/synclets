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
import {ifNotUndefined, isNull, slice} from './other.ts';
import {ASTERISK, EMPTY_STRING, SPACE, strMatch, strTest} from './string.ts';

type Socketish = {send: (packet: string) => void};
type Connection = [
  id: string,
  send: (packet: string) => void,
  receive: (message: ArrayBuffer | string) => void,
  del: () => void,
];

export const getBrokerFunctions = (
  path: string | null,
  brokerPaths: RegExp,
): [
  createConnection: (socketish: Socketish, path: string) => Connection,
  getReceive: (
    path: string,
    id: string,
  ) => ((message: ArrayBuffer | string) => void) | undefined,
  getDel: (path: string, id: string) => (() => void) | undefined,
  getValidPath: (requestUrl: {url?: string}) => string | undefined,
  getPaths: () => string[],
  getClientIds: (path: string) => string[],
  serverAttach: (receivePacket: (packet: string) => Promise<void>) => void,
  serverDetach: () => void,
  serverSendPacket: (packet: string) => void,
] => {
  let serverSend: ((packet: string) => void) | undefined;
  let serverDel: (() => void) | undefined;

  const connectionsBySendable: Map<Socketish, Connection> = mapNew();
  const connectionsByPath: Map<string, Map<string, Connection>> = mapNew();

  const addConnection = (socketish: Socketish, path: string): Connection =>
    ifNotUndefined(
      mapGet(connectionsBySendable, socketish),
      (existingConnection) => existingConnection,
      () => {
        const id = getUniqueId();
        const connectionsForPath = mapEnsure(
          connectionsByPath,
          path,
          mapNew<string, Connection>,
        );

        const send = (packet: string) => socketish.send(packet);

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
          mapDel(connectionsBySendable, socketish);
          mapDel(connectionsForPath, id);
          if (mapIsEmpty(connectionsForPath)) {
            mapDel(connectionsByPath, path);
          }
        };

        const connection: Connection = [id, send, receive, del];

        connectionsBySendable.set(socketish, connection);
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

  const serverAttach = (
    receivePacket: (packet: string) => Promise<void>,
  ): void => {
    if (!isNull(path)) {
      [, , serverSend, serverDel] = addConnection({send: receivePacket}, path);
    }
  };

  const serverDetach = (): void => {
    serverDel?.();
    clearConnections();
    serverDel = undefined;
    serverSend = undefined;
  };

  const serverSendPacket = (packet: string): void => {
    serverSend?.(packet);
  };

  return [
    addConnection,
    getReceive,
    getDel,
    getValidPath,
    getPaths,
    getClientIds,
    serverAttach,
    serverDetach,
    serverSendPacket,
  ];
};
