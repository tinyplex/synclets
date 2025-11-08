# Releases

This is a reverse chronological list of the major Synclets releases, with
highlighted features.

---

# Introducing Synclets

We're excited to introduce Synclets, an open, storage-agnostic, sync engine
development kit.

Synclets is intended to make it easy to synchronize data between the different
parts of your applications, whether between local storage and remote servers,
between different devices, or even across worker boundaries.

We believe synchronization is a fundamental part of modern app development,
especially in the context of rich client and local-first apps. We also believe
that you shouldn't be locked into a specific storage solution, transport layer,
or commercial vendor in order to do this.

This is a very young project, and not ready for production use yet! But we are
sharing it in this early form to invite feedback and contributions from the
community.

We hope you like the idea! If so, please follow us on GitHub, X, or BlueSky, and
stay tuned for future updates as we continue to develop Synclets further.

## The background to Synclets

During the development of our sister project, TinyBase, we found ourselves
needing to build synchronization logic to keep data in sync between local and
remote stores - as well as ways to persist them to various storage backends and
databases.

But we figured these techniques would be valuable to people that are not using
TinyBase too, and so Synclets is essentially an attempt to extract and
generalize these ideas into a standalone project.

(Development on TinyBase will continue as before, but we expect to increasingly
use Synclets as the default underlying engine for its synchronization features
going forward - making it easier for you to piece together the architecture that
best works for you.)

## The philosophy of Synclets

Synclets is designed around a few core principles:

1. Be compatible with as many storage backends as possible, whether
   database-oriented, in-memory, file-based, or otherwise. No vendor lock-in!

2. Work across a variety of transport layers, including WebSockets, in-memory,
   and other broadcast channels.

3. Be modular and extensible, allowing you to customize and extend its
   functionality to suit your specific needs, or to contribute back to the
   community.

4. Prioritize simplicity and ease of use, with clear documentation and examples
   to help you get started quickly.

## How do Synclets work?

Exact implementation details are still evolving, but here's roughly how Synclets
are designed to be used:

1. Instantiate a DataConnector component that interfaces with your chosen
   storage (e.g., SQLite, PGlite, TinyBase, local storage etc. - or one you
   customize yourself)

2. Instantiate a MetaConnector component that stores metadata (primarily
   timestamps), again into any of many storage backends.

3. Instantiate a Transport component that handles communication between
   different parts of your application (e.g., WebSocket server/client,
   BroadcastChannel, etc.)

4. Connect the three components together using a Synclet instance, which, once
   started, orchestrates the synchronization process itself.

```js
import {PGlite} from '@electric-sql/pglite';
import {createSynclet} from 'synclets';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
} from 'synclets/connector/database/pglite';
import {createWsTransport} from 'synclets/transport/ws';

const localPglite = await PGlite.create();
const dataConnector = createPgliteDataConnector(1, localPglite);
const metaConnector = createPgliteMetaConnector(1, localPglite);

const webSocket = new WebSocket('ws://example.com/synclet');
const transport = createWsTransport(webSocket);

const synclet = await createSynclet({dataConnector, metaConnector, transport});

await synclet.start();
// and off we go!
```

This modular approach means you can do plenty of customization for your chosen
environment. For example, you could synchronize the memory state in the UI
thread of your application with local storage in a worker thread.

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

The Synclets project is at a sort of pre-alpha-ish stage right now, so there is
still plenty of work to be done!

There are decent test suites in place for the core components, and some basic
documentation, but we still need to build out more connectors, transports, and
examples.

Our next major milestone will be building out a proof of concept that connects
client-side Sqlite and PGlite databases to CloudFlare Durable Objects, as we
think this might be a popular pattern for many realtime collaborative apps. Stay
tuned for announcements on that one!
