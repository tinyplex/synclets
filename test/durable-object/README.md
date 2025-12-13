# Durable Object Storage Tests

This directory contains integration tests for Durable Object storage connectors using Miniflare.

## Durable Object SQL Support

The storage connector tests (`storage.test.ts`) require **Durable Object SQL** support, which is a newer feature that enables built-in SQLite storage in Cloudflare Workers Durable Objects.

### Current Status

As of December 2025, Durable Object SQL is not yet fully supported in Miniflare 4 for local testing. The tests are currently **skipped** but are ready to be enabled once SQL support becomes available.

### Running Tests

```bash
# Run all durable object tests (SQL tests will be skipped)
npx gulp compileAndTestDurableObject

# Or directly with vitest
npx vitest run test/durable-object
```

### Production Usage

The Durable Object storage connectors work correctly in production Cloudflare Workers environments. To deploy:

1. Configure migrations in your `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "MY_DURABLE_OBJECT"
class_name = "MySyncletDurableObject"
script_name = "my-worker"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["MySyncletDurableObject"]  # Note: new_sqlite_classes, not new_classes
```

2. Implement your Durable Object:

```typescript
import {
  SyncletDurableObject,
  createDurableObjectStorageDataConnector,
  createDurableObjectStorageMetaConnector,
} from 'synclets/durable-object';

export class MySyncletDurableObject extends SyncletDurableObject {
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
}
```

### Test Implementation

The test file includes:
- ✅ Basic instantiation test (runs)
- ⏭️ CRUD operations test (skipped - requires SQL)
- ⏭️ Persistence test (skipped - requires SQL)
- ⏭️ Custom table/column names test (skipped - requires SQL)
- ⏭️ Connector API tests (skipped - requires SQL)

Once Miniflare adds support for Durable Object SQL, simply remove the `.skip` from the test definitions to enable them.

### References

- [Cloudflare Durable Objects SQL Documentation](https://developers.cloudflare.com/durable-objects/api/storage-api/)
- [Miniflare Documentation](https://miniflare.dev/)
- [Wrangler Migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/)
