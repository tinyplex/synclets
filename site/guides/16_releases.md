# Releases

This is a reverse chronological list of the major Synclets releases, with
highlighted features.

# v0.0.5

This release includes some important changes to the WebSocket-oriented synclet
APIs.

The WsTransport has been renamed to WsClientTransport. This can be used for a
client synclet that will be connecting to a WebSocket server elsewhere.

There is a new WsServerTransport component, which is to be used for a server
synclet that will be also acting as a server for other client synclets to
connect to.

The WsServer component is a standalone WebSocket server that can be used to
accept incoming connections from multiple WsClientTransport synclets yet does
not store its own data. This was previously in the synclet/server/stateless-ws
module, but is now also part of the ws module.

---

# Introducing Synclets

**We're excited to introduce Synclets, an open, storage-agnostic, sync engine
development kit.**

Synclets are intended to make it easy to synchronize data between the different
parts of your applications, whether between local storage and remote servers,
between different devices, or even across worker boundaries.

We believe synchronization is a fundamental part of modern app development,
especially in the context of rich client and local-first apps. We also believe
that you shouldn't be locked into a specific storage solution, transport layer,
or vendor in order to do so!

This is a very young project, and not ready for production use yet. But we are
sharing it in this early form to invite feedback and contributions from the
community.

We hope you like the idea of this project! If so, please follow us on
[GitHub](https://github.com/tinyplex/synclets), [X](https://x.com/syncletsjs),
or [BlueSky](https://bsky.app/profile/synclets.bsky.social), and stay tuned for
future updates as we continue to develop Synclets further.

## The background to Synclets

During the development of our sister project, [TinyBase](https://tinybase.org/),
we found ourselves needing to build synchronization logic to keep data in sync
between local and remote stores - as well as ways to persist them to various
storage backends and databases.

But we figured these techniques would be valuable to people that are not using
TinyBase too, and so Synclets is essentially an attempt to extract and
generalize these ideas into a standalone project.

(Development on TinyBase will continue as before, but we expect to increasingly
use Synclets as the default underlying engine for its synchronization features
going forward - making it easier for you to piece together the architecture that
best works for you.)

## The philosophy of Synclets

The Synclets project is designed around a few core principles:

1. Be compatible with as many storage backends as possible, whether
   database-oriented, in-memory, file-based, or otherwise. No vendor lock-in!

2. Work across a variety of transport layers, such as WebSockets, in-memory,
   BroadcastChannel, and so on.

3. Be modular and extensible, allowing you to customize and extend its
   functionality to suit your specific needs, or to contribute back to the
   community.

4. Prioritize simplicity and ease of use, with clear documentation and examples
   to help you get started quickly.

## How do Synclets work?

Exact implementation details are still evolving, but here's roughly how Synclets
are designed to be used:

1. Instantiate a DataConnector component that interfaces with your chosen
   storage (e.g., [SQLite](https://sqlite.org/), [PGlite](http://pglite.dev/),
   TinyBase, local storage etc. - or one you customize yourself)

2. Instantiate a MetaConnector component that stores metadata (primarily
   timestamps), again into any of many storage backends.

3. Instantiate a Transport component that handles communication between
   different parts of your application (e.g. WebSocket server/client,
   BroadcastChannel, etc.)

4. Connect the three components together using a Synclet instance, which, once
   started, orchestrates the synchronization process itself.

Here's an example of how Synclets can synchronize key-values between a local
PGlite database and a local SQLite database over WebSockets:

```js
import {PGlite} from '@electric-sql/pglite';
import {Database} from 'sqlite3';
import {createSynclet} from 'synclets';
import {getUniqueId} from 'synclets/utils';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
} from 'synclets/pglite';
import {
  createSqlite3DataConnector,
  createSqlite3MetaConnector,
} from 'synclets/sqlite3';
import {createWsClientTransport} from 'synclets/ws';
import {WebSocket} from 'ws';

const SERVER = 'wss://demo.synclets.org/' + getUniqueId();

// Synclet 1 (PGlite)
const pglite = await PGlite.create();
const synclet1 = await createSynclet({
  dataConnector: createPgliteDataConnector({depth: 1, pglite}),
  metaConnector: createPgliteMetaConnector({depth: 1, pglite}),
  transport: createWsClientTransport({webSocket: new WebSocket(SERVER)}),
});
await synclet1.start();

// Synclet 2 (SQLite)
const database = new Database(':memory:');
const synclet2 = await createSynclet({
  dataConnector: createSqlite3DataConnector({depth: 1, database}),
  metaConnector: createSqlite3MetaConnector({depth: 1, database}),
  transport: createWsClientTransport({webSocket: new WebSocket(SERVER)}),
});
await synclet2.start();

// Set some data on Synclet 1
await synclet1.setAtom(['foo'], 'bar');
console.log(await synclet1.getData());
// -> {foo: 'bar'}

// ... wait a moment for synchronization to Synclet 2
console.log(await synclet2.getData());
// -> {foo: 'bar'}

await synclet1.destroy();
await synclet2.destroy();
```

This compositional approach means you have a lot of flexibility for how data
flows in your app. For example, you could synchronize an in-memory state in the
UI thread of your application with local storage in a worker thread.

Or you could synchronize data between a local SQLite database and a remote
PostgreSQL server over WebSockets. PGlite in the browser with CloudFlare Durable
Objects. Or, as long as you can implement a few simple methods, between any
storage and over any transport you like!

## The shape of Synclets data

A single Synclet synchronizes a tree of data of a specified depth.

For example, if you are synchronizing a key-value store, you would need Synclets
configured with a depth of `1` at each end (where each node, an 'atom' of data,
is a single value addressed by a key).

If you are synchronizing a single table of records, on the other hand, you would
use a depth of `2` (where each atom is addressed by a unique row Id, and then a
column name).

If you are synchronizing multiple tables of records, you would use a depth of
`3` (where each atom is addressed by a table name, a unique row Id, and then a
column name). And so on.

And the idea is that there should be plenty of easy configuration options for
mapping these tree structures (efficiently) to and from the physical storage
layer.

This means you should theoretically be able to adapt Synclets to work with your
existing data models and architectures, without having to make significant
changes to your codebase.

## What's next?

The Synclets project is pre-alpha right now, so there is still plenty of work to
be done!

There are decent test suites in place for the core components, and some basic
documentation, but we still need to build out more connectors, transports, and
examples.

Our next major milestone will be building out a proof of concept that connects
client-side SQLite and PGlite databases to CloudFlare Durable Objects, as we
think this might be a popular pattern for many realtime collaborative apps. Stay
tuned for announcements on that one!
