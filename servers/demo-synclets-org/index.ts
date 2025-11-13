import {createWsServer} from 'synclets/transport/ws';
import {WebSocketServer} from 'ws';

createWsServer(new WebSocketServer({port: 8043}));
