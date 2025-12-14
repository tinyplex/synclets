import {EMPTY_STRING, strMatch} from '../common/string.ts';

const PATH_REGEX = /\/([^?]*)/;

export const getPathId = (request: Request): string =>
  strMatch(new URL(request.url).pathname, PATH_REGEX)?.[1] ?? EMPTY_STRING;

export const getClientId = (request: Request): string | null =>
  request.headers.get('upgrade')?.toLowerCase() == 'websocket'
    ? request.headers.get('sec-websocket-key')
    : null;

export const createResponse = (
  status: number,
  webSocket: WebSocket | null = null,
  body: string | null = null,
): Response => new Response(body, {status, webSocket});

export const createUpgradeRequiredResponse = (): Response =>
  createResponse(426, null, 'Upgrade required');

export const createNotImplementedResponse = (): Response =>
  createResponse(501, null, 'Not Implemented');
