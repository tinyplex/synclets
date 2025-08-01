import type {
  Address,
  Connector as BaseConnector,
  Transport as BaseTransport,
} from '@synclets/@types';
import type {
  ProtectedConnector,
  ProtectedSynclet,
  ProtectedTransport,
} from './protected.d.ts';

export class Synclet<
  Connector extends BaseConnector = BaseConnector,
  Transport extends BaseTransport = BaseTransport,
> implements ProtectedSynclet<Connector, Transport>
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
    await this.#transport.connect();
    await this.#connector.connect();
    this.#started = true;

    await this.sync([]);
  }

  async stop() {
    await this.#connector.disconnect();
    await this.#transport.disconnect();
    this.#started = false;
  }

  // ---

  async sync(address: Address): Promise<void> {
    if (!this.#started) {
      return;
    }
    await this.#transport.send(
      JSON.stringify({
        address,
        node: await this.#connector.getNode(address),
      }),
    );
  }

  async receive(message: string): Promise<void> {
    if (!this.#started) {
      return;
    }
    const {address, node} = JSON.parse(message);
    if (address && node) {
      await this.#connector.setNode(address, node);
    }
  }
}
