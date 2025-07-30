import {Synclet, Synclet as SyncletDebug} from 'synclets';
import {Connector} from 'synclets/connector';
import {Transport} from 'synclets/transport';

class MyConnector extends Connector {}
class MyTransport extends Transport {}

const _synclet: Synclet = new Synclet(MyConnector, MyTransport);
const _syncletDebug: SyncletDebug = new SyncletDebug(MyConnector, MyTransport);
