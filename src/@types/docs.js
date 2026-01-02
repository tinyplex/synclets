/**
 * The synclets module documents the core Synclet types, helpers, and factory
 * functions.
 * @packageDocumentation
 * @module synclets
 * @since v0.0.0
 */
/// synclets

/**
 * The RESERVED constant is a magic string used to prefix system-reserved
 * identifiers.
 * @category Constant
 * @since v0.0.0
 */
/// RESERVED

/**
 * The Reserved type captures the literal string form of the RESERVED magic
 * string.
 * @category Constant
 * @since v0.0.0
 */
/// Reserved

/**
 * The UNDEFINED constant is a magic string that encodes an `undefined` value.
 * @category Constant
 * @since v0.0.0
 */
/// UNDEFINED

/**
 * The Undefined type reflects the literal string produced by the UNDEFINED
 * magic string.
 * @category Constant
 * @since v0.0.0
 */
/// Undefined

/**
 * The Address type represents an array of string segments that form a path to a
 * specific location within the data or metadata tree. For example, ['users',
 * '123', 'name'] addresses the 'name' atom nested under user '123'. The length
 * of the address must match the configured tree depth.
 * @category Address
 * @since v0.0.0
 */
/// Address

/**
 * The AtomAddress type narrows an Address to a leaf that stores an Atom at a
 * fixed depth in a data tree.
 * @category Address
 * @since v0.0.0
 */
/// AtomAddress

/**
 * The AtomsAddress type targets the parent location that contains a collection
 * of Atoms in a data tree.
 * @category Address
 * @since v0.0.0
 */
/// AtomsAddress

/**
 * The TimestampAddress type narrows an Address to the leaf that stores a
 * Timestamp at a fixed depth in a meta tree.
 * @category Address
 * @since v0.0.0
 */
/// TimestampAddress

/**
 * The TimestampsAddress type targets the parent node that contains a collection
 * of Timestamps in a meta tree.
 * @category Address
 * @since v0.0.0
 */
/// TimestampsAddress

/**
 * The AnyParentAddress type covers every location that has children (whether
 * Atoms, Timestamps, or other parent nodes).
 * @category Address
 * @since v0.0.0
 */
/// AnyParentAddress

/**
 * The AnyAddress type unifies all Atom, Timestamp, and parent addresses a
 * Synclet can reference.
 * @category Address
 * @since v0.0.0
 */
/// AnyAddress

/**
 * The Atom type enumerates the primitive scalar values that can be stored at
 * leaf addresses in the data tree: string, number, boolean, null, or the
 * special UNDEFINED constant (used to represent JavaScript's undefined).
 * Complex objects and arrays cannot be stored directly as Atoms and must be
 * decomposed into scalar values.
 * @category DataConnector
 * @since v0.0.0
 */
/// Atom

/**
 * The Atoms type maps the final part of an address to individual Atom values.
 * @category DataConnector
 * @since v0.0.0
 */
/// Atoms

/**
 * The Data type represents the recursive tree of Atoms and nested maps that
 * make up Synclet data.
 * @category DataConnector
 * @since v0.0.0
 */
/// Data

/**
 * The Timestamp type represents a serialized Hybrid Logical Clock (HLC) value
 * stored as a string. Timestamps are used for conflict resolution during sync,
 * with later timestamps winning over earlier ones. The HLC format combines
 * physical time with a logical counter to provide total ordering even when
 * system clocks are not perfectly synchronized.
 * @category MetaConnector
 * @since v0.0.0
 */
/// Timestamp

/**
 * The Timestamps type maps the final part of an address to individual Timestamp
 * values.
 * @category MetaConnector
 * @since v0.0.0
 */
/// Timestamps

/**
 * The Meta type mirrors the data tree but holds Timestamp information instead
 * of Atoms.
 * @category MetaConnector
 * @since v0.0.0
 */
/// Meta

/**
 * The TimestampAndAtom type pairs a Timestamp with the optional Atom value it
 * describes.
 * @category Message
 * @since v0.0.0
 */
/// TimestampAndAtom

/**
 * The Hash type records the numeric hash used for message verification.
 * @category Message
 * @since v0.0.0
 */
/// Hash

/**
 * The MessageType type enumerates the allowed message kinds, currently the
 * single value 0.
 * @category Message
 * @since v0.0.0
 */
/// MessageType

/**
 * The MessageNode type represents either a Timestamp, a Timestamp-Atom pair, a
 * hash, or nested message nodes.
 * @category Message
 * @since v0.0.0
 */
/// MessageNode

/**
 * The MessageNodes type stores a tuple of child message nodes plus an optional
 * partial marker.
 * @category Message
 * @since v0.0.0
 */
/// MessageNodes

/**
 * The Message type defines the wire-format tuple describing a sync event and
 * its payload.
 * @category Message
 * @since v0.0.0
 */
/// Message
{
  /**
   * The version element records the message format version.
   * @category Message
   * @since v0.0.0
   */
  /// Message.version
  /**
   * The type element indicates which MessageType is being sent.
   * @category Message
   * @since v0.0.0
   */
  /// Message.type
  /**
   * The depth element captures the tree depth addressed by the message.
   * @category Message
   * @since v0.0.0
   */
  /// Message.depth
  /**
   * The address element contains the Address being synchronized.
   * @category Message
   * @since v0.0.0
   */
  /// Message.address
  /**
   * The node element carries the MessageNode payload.
   * @category Message
   * @since v0.0.0
   */
  /// Message.node
  /**
   * The context element provides the Context metadata accompanying the message.
   * @category Message
   * @since v0.0.0
   */
  /// Message.context
}

/**
 * The Context type holds arbitrary key-value metadata that accompanies sync
 * messages and mutation operations. Context values must be Atoms (strings,
 * numbers, booleans, null, or UNDEFINED). Common uses include authentication
 * tokens, user identifiers, request IDs, or any other information needed for
 * authorization, routing, or auditing.
 * @category Context
 * @since v0.0.0
 */
/// Context

/**
 * The ExtraMembers type stores host-provided helper functions keyed by name for
 * connector implementations.
 * @category Core
 * @since v0.0.0
 */
/// ExtraMembers

/**
 * The Logger type describes the optional logging functions a Synclet or its
 * components can use.
 * @category Logging
 * @since v0.0.0
 */
/// Logger
{
  /**
   * The error method logs errors emitted by the synclet stack.
   * @category Logging
   * @since v0.0.0
   */
  /// Logger.error
  /**
   * The warn method logs warning messages.
   * @category Logging
   * @since v0.0.0
   */
  /// Logger.warn
  /**
   * The info method logs informational messages.
   * @category Logging
   * @since v0.0.0
   */
  /// Logger.info
  /**
   * The debug method logs verbose diagnostic messages.
   * @category Logging
   * @since v0.0.0
   */
  /// Logger.debug
}

/**
 * The LogLevel type lists the logger methods that can be invoked.
 * @category Logging
 * @since v0.0.0
 */
/// LogLevel

/**
 * The Synclet interface coordinates connectors, transports, lifecycle
 * functions, and sync operations.
 * @category Core
 * @since v0.0.0
 */
/// Synclet
{
  /**
   * The log method writes synclet log entries at the requested level.
   * @category Logging
   * @since v0.0.0
   */
  /// Synclet.log
  /**
   * The start method activates the Synclet by connecting its data and meta
   * connectors, attaching transports, and beginning message processing. This
   * method must be called before performing sync operations. It invokes the
   * optional onStart implementation callback if provided.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// Synclet.start
  /**
   * The stop method pauses the Synclet by halting connector activity and
   * suspending message processing. The Synclet can be restarted later with
   * start(). This method does not destroy the Synclet or release its resources.
   * It invokes the optional onStop implementation callback if provided.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// Synclet.stop
  /**
   * The isStarted method reports whether the synclet is currently running.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// Synclet.isStarted
  /**
   * The destroy method permanently shuts down the Synclet by disconnecting all
   * connectors and transports, then releasing all owned resources. After
   * calling destroy(), the Synclet instance cannot be restarted and should be
   * discarded.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// Synclet.destroy
  /**
   * The getDataConnector method returns the active data connector instance.
   * @category Component
   * @since v0.0.0
   */
  /// Synclet.getDataConnector
  /**
   * The getMetaConnector method returns the active meta connector instance.
   * @category Component
   * @since v0.0.0
   */
  /// Synclet.getMetaConnector
  /**
   * The getTransport method returns the transports used for messaging.
   * @category Component
   * @since v0.0.0
   */
  /// Synclet.getTransport
  /**
   * The sync method manually triggers synchronization for the specified
   * address, sending the current state to all connected peers via the
   * configured transports. This method invokes the optional onSync
   * implementation callback if provided. Synchronization also occurs
   * automatically after setAtom and delAtom calls when the sync parameter is
   * true.
   * @category Sync
   * @since v0.0.0
   */
  /// Synclet.sync
  /**
   * The setAtom method writes an Atom value at the specified address in the
   * data tree. The address must match the configured depth. If the sync
   * parameter is true (the default), the change is automatically synchronized
   * to connected peers. Optional Context metadata can be attached to the
   * operation. This method invokes the optional onSetAtom implementation
   * callback after the write completes.
   * @category Mutation
   * @since v0.0.0
   */
  /// Synclet.setAtom
  /**
   * The delAtom method removes an Atom value at the specified address in the
   * data tree. If the sync parameter is true (the default), the deletion is
   * automatically synchronized to connected peers. Optional Context metadata
   * can be attached to the operation.
   * @category Mutation
   * @since v0.0.0
   */
  /// Synclet.delAtom
  /**
   * The getData method asynchronously retrieves a read-only snapshot of the
   * complete data tree. The returned object is frozen and cannot be modified.
   * This method uses the getData optimization if the data connector provides
   * it, otherwise it constructs the tree by reading individual Atoms.
   * @category Inspection
   * @since v0.0.0
   */
  /// Synclet.getData
  /**
   * The getMeta method asynchronously retrieves a read-only snapshot of the
   * complete metadata tree. The returned object is frozen and cannot be
   * modified. This method uses the getMeta optimization if the meta connector
   * provides it, otherwise it constructs the tree by reading individual
   * Timestamps.
   * @category Inspection
   * @since v0.0.0
   */
  /// Synclet.getMeta
}

/**
 * The SyncletComponents type bundles the optional connector and transport
 * instances supplied to createSynclet.
 * @category Component
 * @since v0.0.0
 */
/// SyncletComponents
{
  /**
   * The dataConnector property supplies the DataConnector instance to use.
   * @category Component
   * @since v0.0.0
   */
  /// SyncletComponents.dataConnector
  /**
   * The metaConnector property supplies the MetaConnector instance to use.
   * @category Component
   * @since v0.0.0
   */
  /// SyncletComponents.metaConnector
  /**
   * The transport property provides one or more Transport instances.
   * @category Component
   * @since v0.0.0
   */
  /// SyncletComponents.transport
}

/**
 * The SyncletImplementations type collects optional async callback functions
 * that customize Synclet behavior at key lifecycle and operational points.
 *
 * These callbacks allow you to inject custom logic for lifecycle events
 * (onStart, onStop), synchronization hooks (onSync, onSetAtom), message
 * handling (onSendMessage, onReceiveMessage, getSendContext), and fine-grained
 * access control (canReceiveMessage, canReadAtom, canWriteAtom, canRemoveAtom,
 * filterChildIds).
 *
 * All callbacks are optional. The Synclet will use sensible defaults when
 * callbacks are not provided.
 * @category Synclet
 * @since v0.0.0
 */
/// SyncletImplementations
{
  /**
   * The onStart function is called when the synclet starts.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletImplementations.onStart
  /**
   * The onStop function is called when the synclet stops.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// SyncletImplementations.onStop
  /**
   * The onSync function is called before syncing the provided address.
   * @category Sync
   * @since v0.0.0
   */
  /// SyncletImplementations.onSync
  /**
   * The onSendMessage function is called when a message is sent.
   * @category Message
   * @since v0.0.0
   */
  /// SyncletImplementations.onSendMessage
  /**
   * The onReceiveMessage function is called when a message is received.
   * @category Message
   * @since v0.0.0
   */
  /// SyncletImplementations.onReceiveMessage
  /**
   * The onSetAtom function is called after a local Atom is set.
   * @category Mutation
   * @since v0.0.0
   */
  /// SyncletImplementations.onSetAtom
  /**
   * The getSendContext callback can be implemented to generate or augment the
   * Context metadata attached to outgoing sync messages. This allows you to
   * include authentication tokens, user identifiers, or other contextual
   * information that receiving Synclets can use for authorization or routing.
   * @category Message
   * @since v0.0.0
   */
  /// SyncletImplementations.getSendContext
  /**
   * The canReceiveMessage callback can be implemented to filter incoming
   * messages based on their Context metadata. Return true to accept the message
   * or false to reject it. This is useful for implementing authentication,
   * authorization, or message routing logic.
   * @category Filter
   * @since v0.0.0
   */
  /// SyncletImplementations.canReceiveMessage
  /**
   * The canReadAtom callback can be implemented to control read access to
   * individual Atoms based on their address and the request Context. Return
   * true to allow the read or false to deny it. This enables fine-grained
   * authorization policies for data access.
   * @category Filter
   * @since v0.0.0
   */
  /// SyncletImplementations.canReadAtom
  /**
   * The canWriteAtom callback can be implemented to control write access to
   * individual Atoms based on their address, the new value, and the request
   * Context. Return true to allow the write or false to deny it. This enables
   * fine-grained authorization and validation policies for data mutations.
   * @category Filter
   * @since v0.0.0
   */
  /// SyncletImplementations.canWriteAtom
  /**
   * The canRemoveAtom callback can be implemented to control delete access to
   * individual Atoms based on their address and the request Context. Return
   * true to allow the deletion or false to deny it. This enables fine-grained
   * authorization policies for data removal.
   * @category Filter
   * @since v0.0.0
   */
  /// SyncletImplementations.canRemoveAtom
  /**
   * The filterChildIds callback can be implemented to selectively hide child
   * IDs from enumeration based on the parent address and request Context.
   * Return a filtered array of child IDs that should be visible to the caller.
   * This enables hiding portions of the data tree from unauthorized users.
   * @category Filter
   * @since v0.0.0
   */
  /// SyncletImplementations.filterChildIds
  /**
   * The getNow callback can be implemented to provide a custom clock value for
   * timestamp generation. This is primarily useful for deterministic testing
   * where you need reproducible timestamps. If not provided, Date.now() is
   * used.
   * @category Utility
   * @since v0.0.0
   */
  /// SyncletImplementations.getNow
}

/**
 * The SyncletOptions type configures identifiers and logging for a Synclet
 * instance.
 * @category Option
 * @since v0.0.0
 */
/// SyncletOptions
{
  /**
   * The id option overrides the generated synclet identifier.
   * @category Identity
   * @since v0.0.0
   */
  /// SyncletOptions.id
  /**
   * The logger option supplies the Logger used for Synclet messages.
   * @category Logging
   * @since v0.0.0
   */
  /// SyncletOptions.logger
}

/**
 * The createSynclet function wires the provided components, implementations,
 * and options into a fully configured Synclet instance.
 *
 * This is the primary factory function for creating a Synclet. It accepts three
 * optional parameters: components (data/meta connectors and transports),
 * implementation callbacks (lifecycle hooks and permission filters), and
 * configuration options (ID and logger).
 *
 * The function returns a Promise that resolves to a Synclet instance. The
 * Synclet will use memory-based connectors and transport by default if none are
 * provided, making it simple to start with a basic configuration and add
 * persistence later.
 * @param components Data connector, meta connector, and transport(s).
 * @param implementations Lifecycle hooks and permission callbacks.
 * @param options Synclet configuration including id and logger.
 * @essential Configuring a Synclet
 * @category Core
 * @since v0.0.0
 */
/// createSynclet

/**
 * The DataConnector interface defines the component that is responsible for
 * storing Atoms.
 * @category Core
 * @since v0.0.0
 */
/// DataConnector
{
  /**
   * The _brand property identifies DataConnector instances.
   * @category Identity
   * @since v0.0.0
   */
  /// DataConnector._brand
  /**
   * The depth property returns the address depth supported by this connector.
   * @category Structure
   * @since v0.0.0
   */
  /// DataConnector.depth
  /**
   * The log method logs output through the Synclet logger.
   * @category Logging
   * @since v0.0.0
   */
  /// DataConnector.log
}

/**
 * The DataConnectorOptions type describes the base options for creating a data
 * connector.
 * @category DataConnector
 * @since v0.0.0
 */
/// DataConnectorOptions
{
  /**
   * The depth of the address tree.
   * @category Property
   * @since v0.0.0
   */
  /// DataConnectorOptions.depth
}

/**
 * The DataConnectorImplementations type lists the async functions required to
 * read and write Atoms.
 * @category DataConnector
 * @since v0.0.0
 */
/// DataConnectorImplementations
{
  /**
   * The attach callback is invoked when the Synclet is initialized. It receives
   * a syncChangedAtoms function that should be called whenever external changes
   * occur in the underlying storage (e.g., from another process). This enables
   * the Synclet to detect and propagate changes from outside sources. The
   * callback can also perform one-time initialization like creating database
   * tables or opening file handles.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// DataConnectorImplementations.attach
  /**
   * The detach callback is invoked when the Synclet is destroyed. It should
   * clean up any resources allocated during attach, such as closing file
   * handles, database connections, or removing event listeners. The connector
   * will not be used after this callback returns.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// DataConnectorImplementations.detach
  /**
   * The readAtom callback must retrieve the Atom value stored at the specified
   * address. Return the Atom if it exists, or undefined if the address contains
   * no value. This callback is called frequently during sync operations, so
   * efficient implementations are important for performance.
   * @category Data
   * @since v0.0.0
   */
  /// DataConnectorImplementations.readAtom
  /**
   * The writeAtom callback must persist the provided Atom value at the
   * specified address, overwriting any existing value. The callback should
   * handle all Atom types (string, number, boolean, null, and the UNDEFINED
   * constant). Ensure the write is atomic to prevent partial updates during
   * concurrent access.
   * @category Data
   * @since v0.0.0
   */
  /// DataConnectorImplementations.writeAtom
  /**
   * The removeAtom callback must delete the Atom value at the specified
   * address. If no value exists at the address, the operation should succeed
   * silently without error. Ensure the deletion is atomic to prevent partial
   * updates during concurrent access.
   * @category Data
   * @since v0.0.0
   */
  /// DataConnectorImplementations.removeAtom
  /**
   * The readChildIds callback must return an array of child ID strings that
   * exist under the specified parent address. For Atoms addresses, this returns
   * the IDs of Atoms in the parent collection. For deeper tree nodes, this
   * returns the IDs of child branches. Return an empty array if the address has
   * no children.
   * @category Navigation
   * @since v0.0.0
   */
  /// DataConnectorImplementations.readChildIds
}

/**
 * The DataConnectorOptimizations type lists optional bulk operations a
 * connector can implement to improve performance.
 * @category DataConnector
 * @since v0.0.0
 */
/// DataConnectorOptimizations
{
  /**
   * The readAtoms optimization callback can retrieve all Atom values under a
   * parent address in a single operation. Return an object mapping child IDs to
   * their Atom values. Implementing this optimization can significantly improve
   * sync performance by reducing the number of storage round-trips.
   * @category Bulk
   * @since v0.0.0
   */
  /// DataConnectorOptimizations.readAtoms
  /**
   * The getData optimization callback can return the connector's complete data
   * tree in a single operation. This is used by Synclet.getData() when
   * available and can dramatically improve performance for full-tree reads. The
   * returned Data object should match the structure of individual Atom reads.
   * @category Bulk
   * @since v0.0.0
   */
  /// DataConnectorOptimizations.getData
}

/**
 * The createDataConnector function creates a custom DataConnector instance from
 * the provided implementation callbacks.
 *
 * This low-level factory allows you to build connectors for any storage backend
 * by implementing the required read/write callbacks (readAtom, writeAtom,
 * removeAtom, readChildIds). Optional optimization callbacks (readAtoms,
 * getData) can improve bulk operation performance.
 *
 * Most applications should use pre-built connector factories like
 * createPgliteDataConnector or createFileDataConnector rather than calling this
 * function directly.
 * @param options Depth of the data hierarchy.
 * @param implementations Methods for reading/writing atoms and IDs.
 * @param optimizations Bulk read methods for improved performance.
 * @param extraMembers Additional properties to attach.
 * @essential Configuring a Synclet
 * @category Core
 * @since v0.0.0
 */
/// createDataConnector

/**
 * The MetaConnector interface defines the component that is responsible for
 * storing Timestamps.
 * @category Core
 * @since v0.0.0
 */
/// MetaConnector
{
  /**
   * The _brand property identifies MetaConnector instances.
   * @category Identity
   * @since v0.0.0
   */
  /// MetaConnector._brand
  /**
   * The depth property returns the address depth supported by this connector.
   * @category Structure
   * @since v0.0.0
   */
  /// MetaConnector.depth
  /**
   * The log method logs output through the Synclet logger.
   * @category Logging
   * @since v0.0.0
   */
  /// MetaConnector.log
}

/**
 * The MetaConnectorOptions type describes the base options for creating a meta
 * connector.
 * @category MetaConnector
 * @since v0.0.0
 */
/// MetaConnectorOptions
{
  /**
   * The depth of the address tree.
   * @category Property
   * @since v0.0.0
   */
  /// MetaConnectorOptions.depth
}

/**
 * The MetaConnectorImplementations type lists the async functions required to
 * read and write Timestamps.
 * @category MetaConnector
 * @since v0.0.0
 */
/// MetaConnectorImplementations
{
  /**
   * The attach callback is invoked when the Synclet is initialized. It can
   * perform one-time initialization tasks such as creating database tables for
   * timestamp storage or opening file handles. Unlike DataConnector's attach,
   * this callback does not receive a change notification function since
   * timestamps are only modified by the Synclet itself.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// MetaConnectorImplementations.attach
  /**
   * The detach callback is invoked when the Synclet is destroyed. It should
   * clean up any resources allocated during attach, such as closing file
   * handles, database connections, or removing event listeners. The connector
   * will not be used after this callback returns.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// MetaConnectorImplementations.detach
  /**
   * The readTimestamp callback must retrieve the Timestamp string stored at the
   * specified address in the metadata tree. Return the Timestamp if it exists,
   * or undefined if the address contains no timestamp. This callback is called
   * frequently during conflict resolution, so efficient implementations are
   * important for sync performance.
   * @category Meta
   * @since v0.0.0
   */
  /// MetaConnectorImplementations.readTimestamp
  /**
   * The writeTimestamp callback must persist the provided Timestamp string at
   * the specified address in the metadata tree, overwriting any existing
   * timestamp. Timestamps use Hybrid Logical Clock (HLC) format and are
   * critical for conflict resolution. Ensure the write is atomic to prevent
   * inconsistent metadata states.
   * @category Meta
   * @since v0.0.0
   */
  /// MetaConnectorImplementations.writeTimestamp
  /**
   * The readChildIds callback must return an array of child ID strings that
   * have timestamps stored under the specified parent address. The structure
   * mirrors the data tree but contains timestamp child IDs instead of Atom
   * child IDs. Return an empty array if the address has no children with
   * timestamps.
   * @category Navigation
   * @since v0.0.0
   */
  /// MetaConnectorImplementations.readChildIds
}

/**
 * The MetaConnectorOptimizations type lists optional bulk operations a
 * connector can implement to improve performance.
 * @category MetaConnector
 * @since v0.0.0
 */
/// MetaConnectorOptimizations
{
  /**
   * The readTimestamps optimization callback can retrieve all Timestamp values
   * under a parent address in a single operation. Return an object mapping
   * child IDs to their Timestamp strings. Implementing this optimization can
   * significantly improve sync performance by reducing storage round-trips
   * during conflict resolution.
   * @category Bulk
   * @since v0.0.0
   */
  /// MetaConnectorOptimizations.readTimestamps
  /**
   * The getMeta optimization callback can return the connector's complete
   * metadata tree in a single operation. This is used by Synclet.getMeta() when
   * available and can dramatically improve performance for full-tree reads. The
   * returned Meta object should mirror the data tree structure but contain
   * Timestamps instead of Atoms.
   * @category Bulk
   * @since v0.0.0
   */
  /// MetaConnectorOptimizations.getMeta
}

/**
 * The createMetaConnector function creates a custom MetaConnector instance from
 * the provided implementation callbacks.
 *
 * This low-level factory allows you to build metadata storage connectors for
 * any backend by implementing the required timestamp operations (readTimestamp,
 * writeTimestamp, readChildIds). Optional optimization callbacks
 * (readTimestamps, getMeta) can improve bulk operation performance.
 *
 * Most applications should use pre-built connector factories like
 * createPgliteMetaConnector or createFileMetaConnector rather than calling this
 * function directly.
 * @param options Depth of the metadata hierarchy.
 * @param implementations Methods for reading/writing timestamps and IDs.
 * @param optimizations Bulk read methods for improved performance.
 * @param extraMembers Additional properties to attach.
 * @essential Configuring a Synclet
 * @category Core
 * @since v0.0.0
 */
/// createMetaConnector

/**
 * The Transport interface defines the component that is responsible for sending
 * and receiving packets to and from other Synclets.
 * @category Core
 * @since v0.0.0
 */
/// Transport
{
  /**
   * The _brand property identifies Transport instances.
   * @category Identity
   * @since v0.0.0
   */
  /// Transport._brand
  /**
   * The log method logs output through the Synclet logger.
   * @category Logging
   * @since v0.0.0
   */
  /// Transport.log
}

/**
 * The TransportImplementations type lists the async attach, detach, and
 * sendPacket callbacks a Transport requires to operate.
 * @category Transport
 * @since v0.0.0
 */
/// TransportImplementations
{
  /**
   * The attach callback is invoked when the Synclet is initialized. It receives
   * a receivePacket function that must be called whenever a packet arrives from
   * remote peers. The callback should establish the underlying communication
   * channel (e.g., opening a WebSocket, subscribing to a message bus) and wire
   * up incoming message handlers to call receivePacket.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// TransportImplementations.attach
  /**
   * The detach callback is invoked when the Synclet is destroyed. It should
   * close the underlying communication channel (e.g., closing a WebSocket,
   * unsubscribing from a message bus) and clean up any allocated resources. The
   * transport will not be used after this callback returns.
   * @category Lifecycle
   * @since v0.0.0
   */
  /// TransportImplementations.detach
  /**
   * The sendPacket callback must transmit the provided packet string to remote
   * peers through the underlying communication channel. Packets may be
   * fragments of larger messages depending on the configured fragmentSize. The
   * callback should handle transmission failures gracefully and may queue
   * packets if the channel is not immediately ready.
   * @category Message
   * @since v0.0.0
   */
  /// TransportImplementations.sendPacket
}

/**
 * The TransportOptions type configures transport behaviors such as fragment
 * sizes.
 * @category Transport
 * @since v0.0.0
 */
/// TransportOptions
{
  /**
   * The fragmentSize option specifies the maximum packet size in bytes before
   * messages are split into multiple fragments. This is useful for adapting to
   * channel constraints like WebSocket frame size limits. The Transport handles
   * fragmentation and reassembly automatically. If not specified, messages are
   * not fragmented.
   * @category Tuning
   * @since v0.0.0
   */
  /// TransportOptions.fragmentSize
}

/**
 * The createTransport function creates a custom Transport instance from the
 * provided implementation callbacks.
 *
 * This low-level factory enables building transports for any communication
 * channel by implementing the attach, detach, and sendPacket callbacks. The
 * Transport handles message fragmentation and reassembly automatically based on
 * the configured fragment size.
 *
 * Most applications should use pre-built transport factories like
 * createWsClientTransport or createBroadcastChannelTransport rather than
 * calling this function directly.
 * @param implementations Methods for connecting and sending/receiving.
 * @param options Transport configuration including fragment size.
 * @param extraMembers Additional properties to attach.
 * @essential Configuring a Synclet
 * @category Core
 * @since v0.0.0
 */
/// createTransport
