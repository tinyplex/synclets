import {
  createDurableObjectSqliteDataConnector,
  createDurableObjectSqliteMetaConnector,
  PureBrokerDurableObject,
  SyncletDurableObject,
} from 'synclets/durable-object';

export class TestSyncletDurableObject extends SyncletDurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = url.pathname.slice(1);
    const args = JSON.parse(decodeURI(url.search.slice(1)) || '[]');
    if (method in this) {
      return new Response(JSON.stringify(await (this as any)[method](...args)));
    }
    return super.fetch(request);
  }
}

export class TestPureBrokerDurableObject extends PureBrokerDurableObject {}

export class TestConnectorsOnlyDurableObject extends TestSyncletDurableObject {
  getCreateComponents() {
    return {
      dataConnector: createDurableObjectSqliteDataConnector(this.ctx.storage),
      metaConnector: createDurableObjectSqliteMetaConnector(this.ctx.storage),
    };
  }
}
