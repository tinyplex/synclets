# Core Concepts

Before getting started with Synclets, it's helpful to understand a few core
concepts that underpin how it all works.

## What is a Synclet?

A Synclet is an object that manages the synchronization of data and metadata
with another peer over a transport layer. Therefore, to instantiate a Synclet,
you need to provide it with three main components:

1. A DataConnector - to read and write the actual data being synchronized.
2. A MetaConnector - to read and write metadata about the data (primarily
   timestamps).
3. A Transport component - to send and receive synchronization messages with
   another peer.

## DataConnector

A DataConnector is an object that knows how to read and write data to a specific
data store. Synclets are designed to work with a variety of different data
stores, so there are multiple DataConnector implementations available, and you
can also create your own. You will normally create a DataConnector using a
factory function like `createPgliteDataConnector`, specific to the data store
you are using.

## MetaConnector

A MetaConnector is similar to a DataConnector, but it is responsible for reading
and writing metadata about the data being synchronized - primarily timestamps.
This metadata is used by Synclets to determine what data needs to be
synchronized. Like DataConnectors, there are multiple MetaConnector
implementations available, and you can also create your own. You will normally
create a MetaConnector using a factory function like
`createPgliteMetaConnector`, specific to the underlying meta store you are
using.

## Transport

A Transport component is an object that knows how to send and receive
synchronization messages with another peer. Synclets are designed to work over a
variety of transport layers, so there are multiple Transport implementations
available, and again, you can also create your own. You will normally create a
Transport using a factory function like `createWsTransport`, specific to the
medium you want to use.

## Servers

Just for completeness, this project also includes some simple server
implementations to help co-ordinate message transport. For example, there is a
basic WebSocket server implementation that can be addressed when you use the
`createWsTransport` WebSocket Transport.

## The shape of Synclets data

Before we go any further, it's important to understand that a single Synclet
synchronizes only a tree of data of a specified depth. The DataConnector and
MetaConnector you provide to the Synclet must also be configured to work with
data of the same depth.

For example, if you are synchronizing a key-value store, you would need Synclets
configured with a depth of `1` at each end (where each node, an 'atom' of data,
is a single value addressed by a key).

(An atom is currently only a primitive value - e.g., string, number, boolean, or
null.)

```
root
  ├── key1: atom1
  ├── key2: atom2
  ├── key3: atom3
  └── ...
```

If you are synchronizing a single table of records, on the other hand, you would
use a depth of `2` (where each atom is addressed by a unique row Id, and then a
column name).

```
root
  ├── row1
  │    ├── columnA: atom1
  │    ├── columnB: atom2
  │    └── columnC: atom3
  ├── row2
  │    ├── columnA: atom4
  │    ├── columnB: atom5
  │    └── columnC: atom6
  └── ...
```

If you are synchronizing multiple tables of records, you would use a depth of
`3` (where each atom is addressed by a table name, a unique row Id, and then a
column name).

```
root
  ├── table1
  │    ├── row1
  │    │    ├── columnA: atom1
  │    │    ├── columnB: atom2
  │    │    └── columnC: atom3
  │    ├── row2
  │    │    ├── columnA: atom4
  │    │    ├── columnB: atom5
  │    │    └── columnC: atom6
  │    └── ...
  ├── table2
  │    ├── row1
  │    │    ├── columnA: atom7
  │    │    ├── columnB: atom8
  │    │    └── columnC: atom9
  │    ├── row2
  │    │    ├── columnA: atom10
  │    │    ├── columnB: atom11
  │    │    └── columnC: atom12
  │    └── ...
  └── ...
```

And so on.

In the Synclets architecture, data is always represented as a tree of atoms like
this, and addressed with the Address type, an array of keys such as `['table1',
'row2', 'columnB']`.

The idea is that there should be plenty of easy configuration options for
mapping these tree structures (efficiently) to and from the physical storage
layer.

This means you should theoretically be able to adapt Synclets to work with your
existing data models and architectures, without having to make significant
changes to your codebase.
