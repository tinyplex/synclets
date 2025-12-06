<link rel="preload" as="image" href="https://synclets.org/pglite.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/sqlite.svg?asImg"><link rel="preload" as="image" href="https://tinybase.org/favicon.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/browser.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/filesystem.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/memory.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/websockets.svg?asImg"><link rel="preload" as="image" href="https://synclets.org/broadcast.svg?asImg"><link rel="preload" as="image" href="https://tinywidgets.org/favicon.svg?asImg"><link rel="preload" as="image" href="https://tinytick.org/favicon.svg?asImg"><section id="hero"><h2 id="an-open-storage-agnostic-sync-engine-development-kit">An open, storage-agnostic, <em>sync engine</em> development kit.</h2></section><p><a class="start" href="https://synclets.org/guides/releases/#introducing-synclets">Introducing Synclets</a></p><p><span id="one-with">Read about this new project!</span></p><p><a href="https://synclets.org/guides/the-basics/core-concepts">Core concepts</a></p><p><a href="https://synclets.org/api/synclets">Read the docs</a></p><p><a href="https://github.com/tinyplex/synclets">Read the code</a></p><hr><section><h2 id="what-are-synclets">What are Synclets?</h2><p>Synclets are intended to make it easy to synchronize data between the different parts of your applications, whether between local storage and remote servers, between different devices, or even across worker boundaries.</p></section><section><h2 id="why-synclets">Why Synclets?</h2><p>We believe synchronization is a fundamental part of modern app development, especially in the context of rich client and local-first apps. We also believe that you shouldn&#x27;t be locked into a specific storage solution, transport layer, or vendor in order to do so!</p></section><section class="logos"><h2 id="store-your-data-in">Store your data in...</h2><div><a href="https://synclets.org/api/connector-database-pglite"><img src="https://synclets.org/pglite.svg?asImg" width="48"> PGlite</a></div><div><a href="https://synclets.org/api/connector-database-sqlite3"><img src="https://synclets.org/sqlite.svg?asImg" width="48"> SQLite</a></div><div><a href="https://synclets.org/api/connector-tinybase"><img src="https://tinybase.org/favicon.svg?asImg" width="48"> TinyBase</a></div><div><a href="https://synclets.org/api/connector-browser"><img src="https://synclets.org/browser.svg?asImg" width="48"> Browser</a></div><div><a href="https://synclets.org/api/connector-fs"><img src="https://synclets.org/filesystem.svg?asImg" width="48"> Files</a></div><div><a href="https://synclets.org/api/connector-memory"><img src="https://synclets.org/memory.svg?asImg" width="48"> Memory</a></div></section><section class="logos"><h2 id="and-synchronize-it-over">...and synchronize it over:</h2><div><a href="https://synclets.org/api/transport-ws/"><img src="https://synclets.org/websockets.svg?asImg" width="48"> WebSockets</a></div><div><a href="https://synclets.org/api/transport-broadcast-channel/"><img src="https://synclets.org/broadcast.svg?asImg" width="48"> Broadcast</a></div><div><a href="https://synclets.org/api/transport-memory"><img src="https://synclets.org/memory.svg?asImg" width="48"> Memory</a></div></section><section><h2 id="connect-to-a-data-store">Connect to a data store</h2><p>Synclets are designed to work with lots of different flavors of storage and transport. For example, you can easily connect to a local instance of PGlite.</p></section>

```js
import {PGlite} from '@electric-sql/pglite';
import {createPgliteDataConnector} from 'synclets/connector/database/pglite';

const pglite = await PGlite.create();
const dataConnector = createPgliteDataConnector({
  depth: 1,
  pglite,
});
```

<section><h2 id="metadata-is-stored-separately">Metadata is stored separately</h2><p>You can store metadata about your data (primarily timestamps) separately, or in the same data store. For example, here we&#x27;re using PGlite for metadata too.</p></section>

```js
import {createPgliteMetaConnector} from 'synclets/connector/database/pglite';

const metaConnector = createPgliteMetaConnector({
  depth: 1,
  pglite,
});
```

<section><h2 id="pick-a-transport-layer">Pick a transport layer</h2><p>Synclets are designed to work over a variety of transport layers. For example, to use WebSockets via a server use the <a href="https://synclets.org/api/transport-ws/functions/transport/createwsclienttransport/"><code>createWsClientTransport</code></a> function.</p></section>

```js
import {createWsClientTransport} from 'synclets/ws';
import {WebSocket} from 'ws';

const transport = createWsClientTransport(
  new WebSocket('wss://demo.synclets.org/room1'),
);
```

<section><h2 id="and-then-put-it-all-together">And then put it all together</h2><p>Finally compose a <a href="https://synclets.org/api/synclets/interfaces/core/synclet/"><code>Synclet</code></a> instance with your chosen data connector, meta connector, and transport - and start it!</p><p>We&#x27;re good to go.</p><p>Take a look at <a href="http://localhost:8082/guides/releases/#how-do-synclets-work">the sample</a> in our launch announcement for a working example.</p></section>

```js
import {createSynclet} from 'synclets';

const synclet = await createSynclet({
  dataConnector,
  metaConnector,
  transport,
});
await synclet.start();

// ...

await synclet.destroy();
```

<section><h2 id="what-next">What next?</h2><p>The Synclets project is pre-alpha right now, so there is still plenty of work to be done! There are decent test suites in place for the core components, and some basic documentation, but we still need to build out more connectors, transports, and examples.</p></section><section><h2 id="please-follow-along">Please follow along!</h2><p>We hope you like the idea of this project! If so, please follow us on <a href="https://github.com/tinyplex/synclets">GitHub</a>, <a href="https://x.com/syncletsjs">X</a>, or <a href="https://bsky.app/profile/synclets.bsky.social">BlueSky</a>, and stay tuned for future updates as we continue to develop Synclets further.</p><p>Also feel free to kick the tires on our very basic <a href="https://github.com/tinyplex/vite-synclets">Vite template</a>.</p></section><hr><p><a href="https://synclets.org/guides/the-basics/core-concepts">Core concepts</a></p><p><a href="https://synclets.org/api/synclets">Read the docs</a></p><p><a href="https://github.com/tinyplex/synclets">Read the code</a></p><hr><section id="family"><h2 id="meet-the-family">Meet the family</h2><p>The Synclets project is part of a group of libraries designed to help make rich client and local-first apps easier to build. Check out the others:</p><p><a href="https://tinybase.org" target="_blank"><img src="https://tinybase.org/favicon.svg?asImg" width="48"><br><b>TinyBase</b></a><br>A reactive data store and sync engine.</p><p><a href="https://tinywidgets.org" target="_blank"><img src="https://tinywidgets.org/favicon.svg?asImg" width="48"><br><b>TinyWidgets</b></a><br>A collection of tiny, reusable, UI components.</p><p><a href="https://tinytick.org" target="_blank"><img src="https://tinytick.org/favicon.svg?asImg" width="48"><br><b>TinyTick</b></a><br>A tiny but very useful task orchestrator.</p></section>
