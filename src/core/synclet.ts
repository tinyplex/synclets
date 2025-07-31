import type {
  Connector as BaseConnector,
  Transport as BaseTransport,
  Synclet as SyncletDecl,
} from '@synclets/@types';
import type {ProtectedConnector, ProtectedTransport} from './protected.d.ts';

export class Synclet<
  Connector extends BaseConnector = BaseConnector,
  Transport extends BaseTransport = BaseTransport,
> implements SyncletDecl<Connector, Transport>
{
  #connector: ProtectedConnector<Connector>;
  #transport: ProtectedTransport<Transport>;
  #started: boolean = false;

  constructor(connector: Connector, transport: Transport) {
    this.#connector = connector as ProtectedConnector<Connector>;
    this.#connector.attachToSynclet(this);

    this.#transport = transport as ProtectedTransport<Transport>;
    this.#transport.attachToSynclet(this);
  }

  getConnector(): Connector {
    return this.#connector as Connector;
  }

  getTransport(): Transport {
    return this.#transport as Transport;
  }

  getStarted(): boolean {
    return this.#started;
  }

  async start() {
    await this.#connector.connect();
    await this.#transport.connect();
    this.#started = true;
  }

  async stop() {
    await this.#connector.disconnect();
    await this.#transport.disconnect();
    this.#started = false;
  }
}
