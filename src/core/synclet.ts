import type {
  Connector as BaseConnector,
  Transport as BaseTransport,
  Synclet as SyncletDecl,
} from '../@types/index.js';

export class Synclet<
  Connector extends BaseConnector,
  Transport extends BaseTransport,
> implements SyncletDecl<Connector, Transport>
{
  #connector: Connector;
  #transport: Transport;
  #started: boolean = false;

  constructor(connector: Connector, transport: Transport) {
    this.#connector = connector;
    this.#transport = transport;
  }

  getConnector(): Connector {
    return this.#connector;
  }

  getTransport(): Transport {
    return this.#transport;
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
