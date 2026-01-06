import {
  createDurableObjectBrokerTransport,
  createDurableObjectSqliteDataConnector,
  createDurableObjectSqliteMetaConnector,
  type DurableObjectBrokerTransport,
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

export class TestBrokerStoreDurableObject extends TestSyncletDurableObject {
  getCreateTransport() {
    return createDurableObjectBrokerTransport({
      durableObject: this,
    });
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
    });
  }

  getClientIds() {
    return (
      this.getTransport()[0] as DurableObjectBrokerTransport
    ).getClientIds();
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

export class TestBrokerStoreDurableObject1 extends TestBrokerStoreDurableObject {
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

export class TestBrokerStoreDurableObject2 extends TestBrokerStoreDurableObject {
  getCreateDataConnector() {
    return createDurableObjectSqliteDataConnector({
      depth: 2,
      sqlStorage: this.ctx.storage.sql,
    });
  }

  getCreateMetaConnector() {
    return createDurableObjectSqliteMetaConnector({
      depth: 2,
      sqlStorage: this.ctx.storage.sql,
    });
  }
}

export class TestBrokerStoreDurableObject3 extends TestBrokerStoreDurableObject {
  getCreateDataConnector() {
    return createDurableObjectSqliteDataConnector({
      depth: 3,
      sqlStorage: this.ctx.storage.sql,
    });
  }

  getCreateMetaConnector() {
    return createDurableObjectSqliteMetaConnector({
      depth: 3,
      sqlStorage: this.ctx.storage.sql,
    });
  }
}

export class TestBrokerStoreDurableObject4 extends TestBrokerStoreDurableObject {
  getCreateDataConnector() {
    return createDurableObjectSqliteDataConnector({
      depth: 4,
      sqlStorage: this.ctx.storage.sql,
    });
  }

  getCreateMetaConnector() {
    return createDurableObjectSqliteMetaConnector({
      depth: 4,
      sqlStorage: this.ctx.storage.sql,
    });
  }
}

export default {
  fetch: getSyncletDurableObjectFetch('testNamespace'),
};
