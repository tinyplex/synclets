# Synclets

<section id="hero">
  <h2>
    An open, storage-agnostic, <em>sync engine</em> development kit.
  </h2>
</section>

<a class='start' href='/guides/releases/#introducing-synclets'>Introducing Synclets!</a>

<span id="one-with">Read about this new project</span>

<a href='/guides/the-basics/core-concepts'>Core concepts</a>

<a href='/api/synclets'>Read the docs</a>

<a href='https://github.com/tinyplex/synclets'>Read the code</a>

---

> ## What are Synclets?
>
> Synclets are intended to make it easy to synchronize data between the
> different parts of your applications, whether between local storage and remote
> servers, between different devices, or even across worker boundaries.

> ## Why Synclets?
>
> We believe synchronization is a fundamental part of modern app development,
> especially in the context of rich client and local-first apps. We also believe
> that you shouldn't be locked into a specific storage solution, transport
> layer, or vendor in order to do so!

> ## Connect to a data store
>
> Synclets are designed to work with lots of different flavors of storage and
> transport. For example, you can easily connect to a local instance of PGlite.

```js
import {PGlite} from '@electric-sql/pglite';
import {createPgliteDataConnector} from 'synclets/connector/database/pglite';

const db = await PGlite.create();
const dataConnector = createPgliteDataConnector(1, db);
```

> ## Metadata is stored separately
>
> You can store metadata about your data (primarily timestamps) separately, or
> in the same data store. For example, here we're using PGlite for metadata too.

```js
import {createPgliteMetaConnector} from 'synclets/connector/database/pglite';

const metaConnector = createPgliteMetaConnector(1, db);
```

> ## Pick a transport layer
>
> Synclets are designed to work over a variety of transport layers. For example,
> to use WebSockets via a server use the createWsTransport function.

```js
const transport = createWsTransport(
  new WebSocket('wss://demo.synclets.org/room1'),
);
```

> ## And then put it all together
>
> Finally compose a Synclet instance with your chosen data connector, meta
> connector, and transport - and start it!
>
> We're good to go.
>
> Take a look at [the
> sample](http://localhost:8082/guides/releases/#how-do-synclets-work) in our
> launch announcement for a working example.

```js
import {createSynclet} from 'synclets';

const synclet = await createSynclet({
  dataConnector,
  metaConnector,
  transport,
});
await synclet.start();
```

> ## What next?
>
> The Synclets project is pre-alpha right now, so there is still plenty of work
> to be done! There are decent test suites in place for the core components, and
> some basic documentation, but we still need to build out more connectors,
> transports, and examples.

> ## Please follow along!
>
> We hope you like the idea of this project! If so, please follow us on
> [GitHub](https://github.com/tinyplex/synclets), [X](https://x.com/syncletsjs),
> or [BlueSky](https://bsky.app/profile/synclets.bsky.social), and stay tuned
> for future updates as we continue to develop Synclets further.
>
> Also feel free to kick the tires on our very basic [Vite
> template](https://github.com/tinyplex/vite-synclets).

---

<a href='/guides/the-basics/core-concepts'>Core concepts</a>

<a href='/api/synclets'>Read the docs</a>

<a href='https://github.com/tinyplex/synclets'>Read the code</a>

---

<section id="family">
  <h2>Meet the family</h2>
  <p>The Synclets project is part of a group of libraries designed to help make 
  rich client and local-first apps easier to build. Check out the others:</p>

  <p>
    <a href='https://tinybase.org' target='_blank'>
      <img width="48" src="https://tinybase.org/favicon.svg?asImg" />
      <br/>
      <b>TinyBase</b>
    </a>
    <br />A reactive data store and sync engine.
  </p>

  <p>
    <a href='https://tinywidgets.org' target='_blank'>
      <img width="48" src="https://tinywidgets.org/favicon.svg?asImg" />
      <br/>
      <b>TinyWidgets</b>
    </a>
    <br />A collection of tiny, reusable, UI components.
  </p>

  <p>
    <a href='https://tinytick.org' target='_blank'>
      <img width="48" src="https://tinytick.org/favicon.svg?asImg" />
      <br />
      <b>TinyTick</b>
    </a>
    <br />A tiny but very useful task orchestrator.
  </p>
</section>
