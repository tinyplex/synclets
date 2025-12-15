/**
 * The browser module covers LocalStorage, SessionStorage connectors, and
 * BroadcastChannel transport for browser environments.
 * @packageDocumentation
 * @module browser
 * @since v0.0.0
 */
/// browser

/**
 * The BroadcastChannelTransport interface describes a Transport that proxies an
 * existing BroadcastChannel.
 * @category Transport
 * @since v0.0.0
 */
/// BroadcastChannelTransport
{
  /**
   * The getChannelName method returns the name of the wrapped BroadcastChannel.
   * @category Accessor
   * @since v0.0.0
   */
  /// BroadcastChannelTransport.getChannelName
}

/**
 * The createBroadcastChannelTransport function wraps a BroadcastChannel in a
 * BroadcastChannelTransport implementation.
 *
 * This transport enables real-time synchronization between Synclets running
 * in different browser contexts (tabs, windows, iframes) within the same
 * origin. It uses the browser's BroadcastChannel API for efficient, same-origin
 * communication without requiring a server.
 *
 * The transport is only available in browser environments that support the
 * BroadcastChannel API (all modern browsers). It provides automatic
 * fragmentation for large packets and bidirectional communication between all
 * contexts sharing the same channel name.
 *
 * This is ideal for synchronizing state across multiple tabs or windows of the
 * same web application without server involvement.
 * @param channelName The name of the BroadcastChannel to use.
 * @param options Optional TransportOptions for configuring the transport.
 * @returns A BroadcastChannelTransport instance for cross-tab
 *   communication.
 * @category Transport
 * @since v0.0.0
 */
/// createBroadcastChannelTransport

/**
 * The LocalStorageDataConnector interface describes a DataConnector backed by
 * localStorage.
 * @category Connector
 * @since v0.0.0
 */
/// LocalStorageDataConnector
{
  /**
   * The getStorageName method returns the localStorage key namespace.
   * @category Accessor
   * @since v0.0.0
   */
  /// LocalStorageDataConnector.getStorageName
}

/**
 * The createLocalStorageDataConnector function creates a DataConnector that
 * persists Atom data in the browser's localStorage API.
 *
 * Data is stored as JSON under the specified storage key. LocalStorage provides
 * persistent storage that survives browser restarts and is shared across all
 * tabs and windows of the same origin. The storage is synchronous and has a
 * typical size limit of 5-10MB depending on the browser.
 *
 * This connector is designed for browser environments only and will not work in
 * Node.js without a localStorage polyfill.
 * @param options Configuration options for the LocalStorage data connector.
 * @returns A LocalStorageDataConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createLocalStorageDataConnector

/**
 * The LocalStorageDataConnectorOptions type describes the configuration options
 * for creating a localStorage-backed DataConnector.
 * @category Type
 * @since v0.0.0
 */
/// LocalStorageDataConnectorOptions
{
  /**
   * The dataStorageName property specifies the localStorage key for data
   * storage.
   * @category Option
   * @since v0.0.0
   */
  /// LocalStorageDataConnectorOptions.dataStorageName
}

/**
 * The LocalStorageMetaConnector interface describes a MetaConnector backed by
 * localStorage.
 * @category Connector
 * @since v0.0.0
 */
/// LocalStorageMetaConnector
{
  /**
   * The getStorageName method returns the localStorage key namespace.
   * @category Accessor
   * @since v0.0.0
   */
  /// LocalStorageMetaConnector.getStorageName
}

/**
 * The createLocalStorageMetaConnector function creates a MetaConnector that
 * persists Timestamp metadata in the browser's localStorage API.
 *
 * Metadata is stored as JSON under the specified storage key. The metadata
 * structure mirrors the data tree but contains HLC timestamps instead of Atom
 * values, enabling conflict resolution during synchronization.
 * @param options Configuration options for the LocalStorage meta connector.
 * @returns A LocalStorageMetaConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createLocalStorageMetaConnector

/**
 * The LocalStorageMetaConnectorOptions type describes the configuration options
 * for creating a localStorage-backed MetaConnector.
 * @category Type
 * @since v0.0.0
 */
/// LocalStorageMetaConnectorOptions
{
  /**
   * The metaStorageName property specifies the localStorage key for metadata
   * storage.
   * @category Option
   * @since v0.0.0
   */
  /// LocalStorageMetaConnectorOptions.metaStorageName
}

/**
 * The LocalStorageSyncletOptions type describes the configuration options for
 * creating a complete Synclet with localStorage-backed data and meta
 * connectors.
 *
 * This type combines the options for both DataConnector and MetaConnector,
 * along with optional transport, implementations, and other synclet
 * configuration.
 * @category Type
 * @since v0.0.0
 */
/// LocalStorageSyncletOptions
{
  /**
   * The transport property specifies the transport or transports to use.
   * @category Option
   * @since v0.0.0
   */
  /// LocalStorageSyncletOptions.transport
  /**
   * The implementations property specifies custom synclet implementations.
   * @category Option
   * @since v0.0.0
   */
  /// LocalStorageSyncletOptions.implementations
}

/**
 * The LocalStorageSynclet type represents a Synclet with localStorage-backed
 * data and metadata connectors.
 * @category Connector
 * @since v0.0.0
 */
/// LocalStorageSynclet

/**
 * The createLocalStorageSynclet function creates a complete Synclet with
 * localStorage-backed data and meta connectors in a single call.
 *
 * This is the most convenient way to create a browser-based Synclet, handling
 * connector creation and synclet setup with a single options object. Both data
 * and metadata persist across browser sessions.
 * @param options Configuration options including storage names, depth,
 * transport, and other synclet settings.
 * @returns A Promise that resolves to a fully configured Synclet instance.
 * @category Synclet
 * @since v0.0.0
 */
/// createLocalStorageSynclet

/**
 * The SessionStorageDataConnector interface describes a DataConnector backed by
 * sessionStorage.
 * @category Connector
 * @since v0.0.0
 */
/// SessionStorageDataConnector
{
  /**
   * The getStorageName method returns the sessionStorage key namespace.
   * @category Accessor
   * @since v0.0.0
   */
  /// SessionStorageDataConnector.getStorageName
}

/**
 * The createSessionStorageDataConnector function creates a DataConnector that
 * persists Atom data in the browser's sessionStorage API.
 *
 * Data is stored as JSON under the specified storage key. Unlike
 * localStorage, sessionStorage is ephemeral and scoped to a single browser tab
 * or window. Data is cleared when the tab is closed, making it suitable for
 * temporary state that should not persist between sessions.
 *
 * This connector is designed for browser environments only and will not work in
 * Node.js without a sessionStorage polyfill.
 * @param options Configuration options for the SessionStorage data connector.
 * @returns A SessionStorageDataConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createSessionStorageDataConnector

/**
 * The SessionStorageDataConnectorOptions type describes the configuration
 * options for creating a sessionStorage-backed DataConnector.
 * @category Type
 * @since v0.0.0
 */
/// SessionStorageDataConnectorOptions
{
  /**
   * The dataStorageName property specifies the sessionStorage key for data
   * storage.
   * @category Option
   * @since v0.0.0
   */
  /// SessionStorageDataConnectorOptions.dataStorageName
}

/**
 * The SessionStorageMetaConnector interface describes a MetaConnector backed by
 * sessionStorage.
 * @category Connector
 * @since v0.0.0
 */
/// SessionStorageMetaConnector
{
  /**
   * The getStorageName method returns the sessionStorage key namespace.
   * @category Accessor
   * @since v0.0.0
   */
  /// SessionStorageMetaConnector.getStorageName
}

/**
 * The createSessionStorageMetaConnector function creates a MetaConnector that
 * persists Timestamp metadata in the browser's sessionStorage API.
 *
 * Metadata is stored as JSON under the specified storage key. Like the data
 * connector, this storage is ephemeral and scoped to a single tab. The metadata
 * structure mirrors the data tree but contains HLC timestamps for conflict
 * resolution.
 * @param options Configuration options for the SessionStorage meta connector.
 * @returns A SessionStorageMetaConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createSessionStorageMetaConnector

/**
 * The SessionStorageMetaConnectorOptions type describes the configuration
 * options for creating a sessionStorage-backed MetaConnector.
 * @category Type
 * @since v0.0.0
 */
/// SessionStorageMetaConnectorOptions
{
  /**
   * The metaStorageName property specifies the sessionStorage key for metadata
   * storage.
   * @category Option
   * @since v0.0.0
   */
  /// SessionStorageMetaConnectorOptions.metaStorageName
}

/**
 * The SessionStorageSyncletOptions type describes the configuration options for
 * creating a complete Synclet with sessionStorage-backed data and meta
 * connectors.
 *
 * This type combines the options for both DataConnector and MetaConnector,
 * along with optional transport, implementations, and other synclet
 * configuration.
 * @category Type
 * @since v0.0.0
 */
/// SessionStorageSyncletOptions
{
  /**
   * The transport property specifies the transport or transports to use.
   * @category Option
   * @since v0.0.0
   */
  /// SessionStorageSyncletOptions.transport
  /**
   * The implementations property specifies custom synclet implementations.
   * @category Option
   * @since v0.0.0
   */
  /// SessionStorageSyncletOptions.implementations
}

/**
 * The SessionStorageSynclet type represents a Synclet with
 * sessionStorage-backed data and metadata connectors.
 * @category Connector
 * @since v0.0.0
 */
/// SessionStorageSynclet

/**
 * The createSessionStorageSynclet function creates a complete Synclet with
 * sessionStorage-backed data and meta connectors in a single call.
 *
 * This is the most convenient way to create a browser-based Synclet with
 * ephemeral, tab-scoped storage, handling connector creation and synclet setup
 * with a single options object. Data and metadata are cleared when the tab
 * closes.
 * @param options Configuration options including storage names, depth,
 * transport, and other synclet settings.
 * @returns A Promise that resolves to a fully configured Synclet instance.
 * @category Synclet
 * @since v0.0.0
 */
/// createSessionStorageSynclet
