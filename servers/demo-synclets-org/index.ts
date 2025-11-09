import {createStatelessWsServer} from 'synclets/server/stateless-ws';
import {WebSocketServer} from 'ws';

createStatelessWsServer(new WebSocketServer({port: 8043}));
