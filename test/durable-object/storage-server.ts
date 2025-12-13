import {
  SyncletDurableObject,
  createDurableObjectStorageDataConnector,
  createDurableObjectStorageMetaConnector,
} from 'synclets/durable-object';

export class TestStorageSyncletDurableObject extends SyncletDurableObject {
  getCreateComponents() {
    return {
      dataConnector: createDurableObjectStorageDataConnector({
        depth: 3,
        storage: this.ctx.storage,
      }),
      metaConnector: createDurableObjectStorageMetaConnector({
        depth: 3,
        storage: this.ctx.storage,
      }),
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/setAtom' && request.method === 'POST') {
      const {address, atom} = await request.json();
      await this.setAtom(address, atom);
      return new Response('OK');
    }

    if (url.pathname === '/delAtom' && request.method === 'POST') {
      const {address} = await request.json();
      await this.delAtom(address);
      return new Response('OK');
    }

    if (url.pathname === '/getData') {
      const data = await this.getData();
      return Response.json(data);
    }

    if (url.pathname === '/getMeta') {
      const meta = await this.getMeta();
      return Response.json(meta);
    }

    if (url.pathname === '/getDataConnector') {
      const connector = this.getDataConnector();
      const hasGetStorage = typeof connector?.getStorage === 'function';
      return Response.json(hasGetStorage);
    }

    if (url.pathname === '/getMetaConnector') {
      const connector = this.getMetaConnector();
      const hasGetStorage = typeof connector?.getStorage === 'function';
      return Response.json(hasGetStorage);
    }

    return new Response('Not found', {status: 404});
  }
}

export class TestCustomStorageSyncletDurableObject extends SyncletDurableObject {
  getCreateComponents() {
    return {
      dataConnector: createDurableObjectStorageDataConnector({
        depth: 2,
        storage: this.ctx.storage,
        dataTable: 'custom_data',
        addressColumn: 'addr',
        atomColumn: 'value',
      }),
      metaConnector: createDurableObjectStorageMetaConnector({
        depth: 2,
        storage: this.ctx.storage,
        metaTable: 'custom_meta',
        addressColumn: 'addr',
        timestampColumn: 'ts',
      }),
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/setAtom' && request.method === 'POST') {
      const {address, atom} = await request.json();
      await this.setAtom(address, atom);
      return new Response('OK');
    }

    if (url.pathname === '/delAtom' && request.method === 'POST') {
      const {address} = await request.json();
      await this.delAtom(address);
      return new Response('OK');
    }

    if (url.pathname === '/getData') {
      const data = await this.getData();
      return Response.json(data);
    }

    return new Response('Not found', {status: 404});
  }
}
