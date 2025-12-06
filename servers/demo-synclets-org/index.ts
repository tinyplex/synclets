import {createWsServer} from 'synclets/ws';
import {WebSocketServer} from 'ws';

createWsServer(new WebSocketServer({port: 8043}));
