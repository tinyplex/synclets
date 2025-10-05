import type {
  WsServer,
  createWsServer as createWsServerDecl,
} from '@synclets/@types/server/ws';
import {WebSocket, WebSocketServer} from 'ws';
import {
  mapClear,
  mapDel,
  mapEnsure,
  mapForEach,
  mapGet,
  mapIsEmpty,
  mapNew,
  mapSet,
} from '../../common/map.ts';
import {objFreeze} from '../../common/object.ts';
import {ifNotUndefined, slice} from '../../common/other.ts';
import {ASTERISK, SPACE, UTF8, strMatch} from '../../common/string.ts';

const PATH_REGEX = /\/([^?]*)/;

export const createWsServer = ((webSocketServer: WebSocketServer) => {
  const syncletsByPath: Map<string, Map<string, WebSocket>> = mapNew();

  webSocketServer.on('connection', (synclet, request) =>
    ifNotUndefined(strMatch(request.url, PATH_REGEX), ([, pathId]) =>
      ifNotUndefined(request.headers['sec-websocket-key'], async (id) => {
        const synclets = mapEnsure(
          syncletsByPath,
          pathId,
          mapNew<string, WebSocket>,
        );
        mapSet(synclets, id, synclet);

        synclet.on('message', (data) => {
          const packet = data.toString(UTF8);
          const splitAt = packet.indexOf(SPACE);
          if (splitAt !== -1) {
            const to = slice(packet, 0, splitAt);
            const remainder = slice(packet, splitAt + 1);
            const forwardedPacket = id + SPACE + remainder;
            if (to === ASTERISK) {
              mapForEach(synclets, (otherSyncletId, otherSynclet) =>
                otherSyncletId !== id ? otherSynclet.send(forwardedPacket) : 0,
              );
            } else {
              mapGet(synclets, to)?.send(forwardedPacket);
            }
          }
        });

        synclet.on('close', () => {
          mapDel(synclets, id);
          if (mapIsEmpty(synclets)) {
            mapDel(syncletsByPath, pathId);
          }
        });
      }),
    ),
  );

  const getWebSocketServer = () => webSocketServer;

  const destroy = async () => {
    mapClear(syncletsByPath);
    webSocketServer.close();
  };

  const wsServer = {
    getWebSocketServer,
    destroy,
  };

  return objFreeze(wsServer as WsServer);
}) as typeof createWsServerDecl;
