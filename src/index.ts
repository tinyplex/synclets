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

  getConnector(): Connector {
    return this.connector;
  }

  getTransport(): Transport {
    return this.transport;
  }

  getStarted(): boolean {
    return this.started;
  }

  async start() {
    await this.connector.connect();
    // await this.transport.connect();
    this.started = true;
  }

  async stop() {
    this.started = false;
  }
}
