import {
  createDurableObjectBrokerTransport,
  createDurableObjectSqliteDataConnector,
  createDurableObjectSqliteMetaConnector,
  SyncletDurableObject,
} from 'synclets/durable-object';

const api = async (
  ths: SyncletDurableObject,
  method: string,
  ...args: any[]
) => {
  if (method in ths) {
    return await (ths as any)[method](...args);
  }
  return undefined;
};

export class TestSyncletDurableObject extends SyncletDurableObject {
  async api(method: string, ...args: any[]): Promise<any> {
    return await api(this, method, ...args);
  }

  getClientCount() {
    return this.ctx.getWebSockets().length;
  }
}

export class TestBrokerOnlyDurableObject extends TestSyncletDurableObject {
  getCreateTransport() {
    return createDurableObjectBrokerTransport({durableObject: this});
  }
}

export class TestConnectorsOnlyDurableObject extends TestSyncletDurableObject {
  getCreateDataConnector() {
    return createDurableObjectSqliteDataConnector({
      depth: 1,
      sqlStorage: this.ctx.storage.sql,
    });
  }

  getCreateMetaConnector() {
    return createDurableObjectSqliteMetaConnector({
      depth: 1,
      sqlStorage: this.ctx.storage.sql,
    });
  }
}
