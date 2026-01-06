import {RESERVED} from '@synclets';
import {getUniqueId} from '@synclets/utils';
import {arrayFilter} from './array.ts';
import {
  mapClear,
  mapDel,
  mapForEach,
  mapGet,
  mapKeys,
  mapNew,
  mapSet,
} from './map.ts';
import {ifNotUndefined, slice} from './other.ts';
import {ASTERISK, SPACE} from './string.ts';

const SERVER_ID = RESERVED + 's';

type Socket = {send: (packet: string) => void};
type Connection = [
  send: (packet: string) => void,
  receive: (message: ArrayBuffer | string) => void,
  close: () => void,
];

export const getBrokerFunctions = (): [
  createConnection: (socket: Socket) => void,
  socketMessage: (socket: Socket, message: ArrayBuffer | string) => void,
  socketClose: (socket: Socket) => void,
  socketError: (socket: Socket) => void,
  serverAttach: (receivePacket: (packet: string) => void) => void,
  serverDetach: () => void,
  serverSendPacket: (packet: string) => void,
  getClientIds: () => string[],
] => {
  let serverSend: ((packet: string) => void) | undefined;
  let serverClose: (() => void) | undefined;

  const connectionsBySocket: Map<Socket, Connection> = mapNew();
  const connectionsById: Map<string, Connection> = mapNew();

  const addSocket = (socket: Socket, id = getUniqueId()): Connection =>
    ifNotUndefined(
      mapGet(connectionsBySocket, socket),
      (existingConnection) => existingConnection,
      () => {
        const send = (packet: string) => socket.send(packet);

        const receive = (message: ArrayBuffer | string) => {
          const packet = message.toString();
          const splitAt = packet.indexOf(SPACE);
          if (splitAt !== -1) {
            const to = slice(packet, 0, splitAt);
            const remainder = slice(packet, splitAt + 1);
            const forwardedPacket = id + SPACE + remainder;
            if (to === ASTERISK) {
              mapForEach(connectionsById, (otherId, [send]) =>
                otherId !== id ? send(forwardedPacket) : 0,
              );
            } else if (to != id) {
              mapGet(connectionsById, to)?.[0](forwardedPacket);
            }
          }
        };

        const close = () => {
          mapDel(connectionsBySocket, socket);
          mapDel(connectionsById, id);
        };

        const connection: Connection = [send, receive, close];

        connectionsBySocket.set(socket, connection);
        mapSet(connectionsById, id, connection);

        return connection;
      },
    ) as Connection;

  const socketMessage = (socket: Socket, message: ArrayBuffer | string): void =>
    mapGet(connectionsBySocket, socket)?.[1]?.(message);

  const socketClose = (socket: Socket): void =>
    mapGet(connectionsBySocket, socket)?.[2]?.();

  const socketError = socketClose;

  const serverAttach = (receivePacket: (packet: string) => void): void => {
    [, serverSend, serverClose] = addSocket({send: receivePacket}, SERVER_ID);
  };

  const serverDetach = (): void => {
    serverClose?.();
    mapClear(connectionsById);
    mapClear(connectionsBySocket);
    serverClose = undefined;
    serverSend = undefined;
  };

  const serverSendPacket = (packet: string): void => {
    serverSend?.(packet);
  };

  const getClientIds = (): string[] =>
    arrayFilter(mapKeys(connectionsById), (id) => id != SERVER_ID);

  return [
    addSocket,
    socketMessage,
    socketClose,
    socketError,
    serverAttach,
    serverDetach,
    serverSendPacket,
    getClientIds,
  ];
};
