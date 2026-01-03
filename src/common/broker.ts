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

type Socket = {send: (packet: string) => void};
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
  createConnection: (socket: Socket, path: string) => Connection,
  getReceive: (
    socket: Socket,
  ) => ((message: ArrayBuffer | string) => void) | undefined,
  getDel: (socket: Socket) => (() => void) | undefined,
  getValidPath: (requestUrl: {url?: string}) => string | undefined,
  getPaths: () => string[],
  getClientIds: (path: string) => string[],
  serverAttach: (receivePacket: (packet: string) => Promise<void>) => void,
  serverDetach: () => void,
  serverSendPacket: (packet: string) => void,
] => {
  let serverSend: ((packet: string) => void) | undefined;
  let serverDel: (() => void) | undefined;

  const connectionsBySocket: Map<Socket, Connection> = mapNew();
  const connectionsByPath: Map<string, Map<string, Connection>> = mapNew();

  const addConnection = (socket: Socket, path: string): Connection =>
    ifNotUndefined(
      mapGet(connectionsBySocket, socket),
      (existingConnection) => existingConnection,
      () => {
        const id = getUniqueId();
        const connectionsForPath = mapEnsure(
          connectionsByPath,
          path,
          mapNew<string, Connection>,
        );

        const send = (packet: string) => socket.send(packet);

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
          mapDel(connectionsBySocket, socket);
          mapDel(connectionsForPath, id);
          if (mapIsEmpty(connectionsForPath)) {
            mapDel(connectionsByPath, path);
          }
        };

        const connection: Connection = [id, send, receive, del];

        connectionsBySocket.set(socket, connection);
        mapSet(connectionsForPath, id, connection);

        return connection;
      },
    ) as Connection;

  const getReceive = (socket: Socket) =>
    mapGet(connectionsBySocket, socket)?.[2];

  const getDel = (socket: Socket) => mapGet(connectionsBySocket, socket)?.[3];

  const clearConnections = () => {
    mapClear(connectionsByPath);
    mapClear(connectionsBySocket);
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
