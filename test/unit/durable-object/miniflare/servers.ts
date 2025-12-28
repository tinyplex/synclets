import {
  createDurableObjectBrokerTransport,
  createDurableObjectSqliteDataConnector,
  createDurableObjectSqliteMetaConnector,
  getSyncletDurableObjectFetch,
  SyncletDurableObject,
} from 'synclets/durable-object';

export class TestSyncletDurableObject extends SyncletDurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const method = url.pathname.slice('/api/'.length);
      if (method in this) {
        return new Response(
          JSON.stringify(
            (await (this as any)[method](
              ...JSON.parse(decodeURIComponent(url.search.slice(1))),
            )) ?? null,
          ),
        );
      }
    }
    return await super.fetch(request);
  }

  getClientCount() {
    return this.ctx.getWebSockets().length;
  }
}

export class TestBrokerOnlyDurableObject extends TestSyncletDurableObject {
  getCreateTransport() {
    return createDurableObjectBrokerTransport({
      durableObject: this,
    });
  }
}

export class TestSelectiveBrokerOnlyDurableObject extends TestSyncletDurableObject {
  getCreateTransport() {
    return createDurableObjectBrokerTransport({
      durableObject: this,
      brokerPaths: /^valid.*/,
    });
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

export default {
  fetch: getSyncletDurableObjectFetch('testNamespace'),
};
