<p>This is a reverse chronological list of the major Synclets releases, with highlighted features.</p><h1 id="v0-0-5">v0.0.5</h1><p>This release includes some important changes to the WebSocket-oriented synclet APIs.</p><p>The WsTransport has been renamed to <a href="https://synclets.org/api/transport-ws/interfaces/transport/wsclienttransport/"><code>WsClientTransport</code></a>. This can be used for a client synclet that will be connecting to a WebSocket server elsewhere.</p><p>There is a new <a href="https://synclets.org/api/transport-ws/interfaces/transport/wsservertransport/"><code>WsServerTransport</code></a> component, which is to be used for a server synclet that will be also acting as a server for other client synclets to connect to.</p><p>The <a href="https://synclets.org/api/transport-ws/interfaces/server/wsserver/"><code>WsServer</code></a> component is a standalone WebSocket server that can be used to accept incoming connections from multiple <a href="https://synclets.org/api/transport-ws/interfaces/transport/wsclienttransport/"><code>WsClientTransport</code></a> synclets yet does not store its own data. This was previously in the synclet/server/stateless-ws module, but is now also part of the <a href="https://synclets.org/api/transport-ws/"><code>transport/ws</code></a> module.</p><hr><h1 id="introducing-synclets">Introducing Synclets</h1><p><strong>We&#x27;re excited to introduce Synclets, an open, storage-agnostic, sync engine development kit.</strong></p><p>Synclets are intended to make it easy to synchronize data between the different parts of your applications, whether between local storage and remote servers, between different devices, or even across worker boundaries.</p><p>We believe synchronization is a fundamental part of modern app development, especially in the context of rich client and local-first apps. We also believe that you shouldn&#x27;t be locked into a specific storage solution, transport layer, or vendor in order to do so!</p><p>This is a very young project, and not ready for production use yet. But we are sharing it in this early form to invite feedback and contributions from the community.</p><p>We hope you like the idea of this project! If so, please follow us on <a href="https://github.com/tinyplex/synclets">GitHub</a>, <a href="https://x.com/syncletsjs">X</a>, or <a href="https://bsky.app/profile/synclets.bsky.social">BlueSky</a>, and stay tuned for future updates as we continue to develop Synclets further.</p><h2 id="the-background-to-synclets">The background to Synclets</h2><p>During the development of our sister project, <a href="https://tinybase.org/">TinyBase</a>, we found ourselves needing to build synchronization logic to keep data in sync between local and remote stores - as well as ways to persist them to various storage backends and databases.</p><p>But we figured these techniques would be valuable to people that are not using TinyBase too, and so Synclets is essentially an attempt to extract and generalize these ideas into a standalone project.</p><p>(Development on TinyBase will continue as before, but we expect to increasingly use Synclets as the default underlying engine for its synchronization features going forward - making it easier for you to piece together the architecture that best works for you.)</p><h2 id="the-philosophy-of-synclets">The philosophy of Synclets</h2><p>The Synclets project is designed around a few core principles:</p><ol><li><p>Be compatible with as many storage backends as possible, whether database-oriented, in-memory, file-based, or otherwise. No vendor lock-in!</p></li><li><p>Work across a variety of transport layers, such as WebSockets, in-memory, BroadcastChannel, and so on.</p></li><li><p>Be modular and extensible, allowing you to customize and extend its functionality to suit your specific needs, or to contribute back to the community.</p></li><li><p>Prioritize simplicity and ease of use, with clear documentation and examples to help you get started quickly.</p></li></ol><h2 id="how-do-synclets-work">How do Synclets work?</h2><p>Exact implementation details are still evolving, but here&#x27;s roughly how Synclets are designed to be used:</p><ol><li><p>Instantiate a <a href="https://synclets.org/api/synclets/interfaces/core/dataconnector/"><code>DataConnector</code></a> component that interfaces with your chosen storage (e.g., <a href="https://sqlite.org/">SQLite</a>, <a href="http://pglite.dev/">PGlite</a>, TinyBase, local storage etc. - or one you customize yourself)</p></li><li><p>Instantiate a <a href="https://synclets.org/api/synclets/interfaces/core/metaconnector/"><code>MetaConnector</code></a> component that stores metadata (primarily timestamps), again into any of many storage backends.</p></li><li><p>Instantiate a <a href="https://synclets.org/api/synclets/interfaces/core/transport/"><code>Transport</code></a> component that handles communication between different parts of your application (e.g. WebSocket server/client, BroadcastChannel, etc.)</p></li><li><p>Connect the three components together using a <a href="https://synclets.org/api/synclets/interfaces/core/synclet/"><code>Synclet</code></a> instance, which, once started, orchestrates the synchronization process itself.</p></li></ol><p>Here&#x27;s an example of how Synclets can synchronize key-values between a local PGlite database and a local SQLite database over WebSockets:</p>

```js
import {PGlite} from '@electric-sql/pglite';
import {Database} from 'sqlite3';
import {createSynclet} from 'synclets';
import {getUniqueId} from 'synclets/utils';
import {
  createPgliteDataConnector,
  createPgliteMetaConnector,
} from 'synclets/connector/database/pglite';
import {
  createSqlite3DataConnector,
  createSqlite3MetaConnector,
} from 'synclets/connector/database/sqlite3';
import {createWsClientTransport} from 'synclets/transport/ws';
import {WebSocket} from 'ws';

const SERVER = 'wss://demo.synclets.org/' + getUniqueId();

// Synclet 1 (PGlite)
const pglite = await PGlite.create();
const synclet1 = await createSynclet({
  dataConnector: createPgliteDataConnector(1, pglite),
  metaConnector: createPgliteMetaConnector(1, pglite),
  transport: createWsClientTransport(new WebSocket(SERVER)),
});
await synclet1.start();

// Synclet 2 (SQLite)
const sqlite = new Database(':memory:');
const synclet2 = await createSynclet({
  dataConnector: createSqlite3DataConnector(1, sqlite),
  metaConnector: createSqlite3MetaConnector(1, sqlite),
  transport: createWsClientTransport(new WebSocket(SERVER)),
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

<p>This compositional approach means you have a lot of flexibility for how data flows in your app. For example, you could synchronize an in-memory state in the UI thread of your application with local storage in a worker thread.</p><p>Or you could synchronize data between a local SQLite database and a remote PostgreSQL server over WebSockets. PGlite in the browser with CloudFlare Durable Objects. Or, as long as you can implement a few simple methods, between any storage and over any transport you like!</p><h2 id="the-shape-of-synclets-data">The shape of Synclets data</h2><p>A single <a href="https://synclets.org/api/synclets/interfaces/core/synclet/"><code>Synclet</code></a> synchronizes a tree of data of a specified depth.</p><p>For example, if you are synchronizing a key-value store, you would need Synclets configured with a depth of <code>1</code> at each end (where each node, an &#x27;atom&#x27; of data, is a single value addressed by a key).</p><p>If you are synchronizing a single table of records, on the other hand, you would use a depth of <code>2</code> (where each atom is addressed by a unique row Id, and then a column name).</p><p>If you are synchronizing multiple tables of records, you would use a depth of <code>3</code> (where each atom is addressed by a table name, a unique row Id, and then a column name). And so on.</p><p>And the idea is that there should be plenty of easy configuration options for mapping these tree structures (efficiently) to and from the physical storage layer.</p><p>This means you should theoretically be able to adapt Synclets to work with your existing data models and architectures, without having to make significant changes to your codebase.</p><h2 id="what-s-next">What&#x27;s next?</h2><p>The Synclets project is pre-alpha right now, so there is still plenty of work to be done!</p><p>There are decent test suites in place for the core components, and some basic documentation, but we still need to build out more connectors, transports, and examples.</p><p>Our next major milestone will be building out a proof of concept that connects client-side SQLite and PGlite databases to CloudFlare Durable Objects, as we think this might be a popular pattern for many realtime collaborative apps. Stay tuned for announcements on that one!</p>