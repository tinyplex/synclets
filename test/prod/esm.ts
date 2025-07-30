import {Synclet, Synclet as SyncletDebug} from 'synclets';
import {BaseConnector} from 'synclets/connector';
import {BaseTransport} from 'synclets/transport';

class MyConnector extends BaseConnector {}
class MyTransport extends BaseTransport {}

const synclet = new Synclet(MyConnector, MyTransport);
synclet.getConnector();
synclet.getTransport();

const syncletDebug = new SyncletDebug(MyConnector, MyTransport);
syncletDebug.getConnector();
syncletDebug.getTransport();
