import type {Connector, ConnectorClass} from './@types/connector/index.d.ts';
import type {Synclet as SyncletDecl} from './@types/index.d.ts';
import type {Transport, TransportClass} from './@types/transport/index.d.ts';

export class Synclet implements SyncletDecl {
  private connector: Connector;
  private transport: Transport;

  constructor(connectorClass: ConnectorClass, transportClass: TransportClass) {
    this.connector = new connectorClass();
    this.transport = new transportClass();
  }

  async start() {}
  async stop() {}
}
