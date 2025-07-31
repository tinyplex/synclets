import {Connector, Synclet, Synclet as SyncletDebug, Transport} from 'synclets';

class MyConnector extends Connector {}
class MyTransport extends Transport {}

const synclet = new Synclet(new MyConnector(), new MyTransport());
synclet.getConnector();
synclet.getTransport();

const syncletDebug = new SyncletDebug(new MyConnector(), new MyTransport());
syncletDebug.getConnector();
syncletDebug.getTransport();
