import type {BaseConnector} from './@types/connector/index.d.ts';
import type {Class, Synclet as SyncletDecl} from './@types/index.d.ts';
import type {BaseTransport} from './@types/transport/index.d.ts';

export class Synclet<
  Connector extends BaseConnector,
  Transport extends BaseTransport,
> implements SyncletDecl<Connector, Transport>
{
  private connector: Connector;
  private transport: Transport;
  private started: boolean = false;

  constructor(
    connectorClass: Class<Connector>,
    transportClass: Class<Transport>,
  ) {
    this.connector = new connectorClass();
    this.transport = new transportClass();
  }

  getConnector = (): Connector => this.connector;

  getTransport = (): Transport => this.transport;

  getStarted = (): boolean => this.started;

  async start() {
    this.started = true;
  }
  async stop() {
    this.started = false;
  }
}
