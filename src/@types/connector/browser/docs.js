/**
 * The connector/browser module covers LocalStorage and SessionStorage connector
 * types.
 * @packageDocumentation
 * @module connector/browser
 * @since v0.0.0
 */
/// connector/browser

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
 * @category Connector
 * @since v0.0.0
 */
/// createLocalStorageDataConnector

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
 * @category Connector
 * @since v0.0.0
 */
/// createLocalStorageMetaConnector

/**
 * The LocalStorageConnectorsOptions type specifies configuration for both data
 * and meta connectors when using createLocalStorageConnectors.
 * @category Connector
 * @since v0.0.5
 */
/// LocalStorageConnectorsOptions
{
  /**
   * The dataStorageName property specifies the localStorage key for data.
   * @category Option
   * @since v0.0.5
   */
  /// LocalStorageConnectorsOptions.dataStorageName
  /**
   * The metaStorageName property specifies the localStorage key for metadata.
   * @category Option
   * @since v0.0.5
   */
  /// LocalStorageConnectorsOptions.metaStorageName
}

/**
 * The createLocalStorageConnectors function creates both a localStorage-backed
 * DataConnector and MetaConnector together in a single call, returning them as
 * a tuple.
 *
 * This is the recommended approach for browser-based Synclets where both data
 * and metadata should persist across sessions. The function provides a
 * simplified API compared to creating the connectors separately.
 *
 * When options are not provided, both connectors use the same storageName key,
 * storing data and metadata together. For better organization or to work around
 * size limits, you can specify separate keys via the options parameter.
 * @param depth The tree depth the Synclet will operate at.
 * @param storageName The base localStorage key (used for both connectors if
 * options not provided).
 * @param options Optional configuration to use separate storage keys.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createLocalStorageConnectors

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
 * @category Connector
 * @since v0.0.0
 */
/// createSessionStorageDataConnector

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
 * @category Connector
 * @since v0.0.0
 */
/// createSessionStorageMetaConnector

/**
 * The SessionStorageConnectorsOptions type specifies configuration for both
 * data and meta connectors when using createSessionStorageConnectors.
 * @category Connector
 * @since v0.0.5
 */
/// SessionStorageConnectorsOptions
{
  /**
   * The dataStorageName property specifies the sessionStorage key for data.
   * @category Option
   * @since v0.0.5
   */
  /// SessionStorageConnectorsOptions.dataStorageName
  /**
   * The metaStorageName property specifies the sessionStorage key for metadata.
   * @category Option
   * @since v0.0.5
   */
  /// SessionStorageConnectorsOptions.metaStorageName
}

/**
 * The createSessionStorageConnectors function creates both a sessionStorage-
 * backed DataConnector and MetaConnector together in a single call, returning
 * them as a tuple.
 *
 * This is useful for browser-based Synclets that need temporary, tab-scoped
 * persistence. The ephemeral nature of sessionStorage makes it ideal for
 * maintaining state during a browsing session without cluttering permanent
 * storage.
 *
 * When options are not provided, both connectors use the same storageName key.
 * For better organization, you can specify separate keys via the options
 * parameter.
 * @param depth The tree depth the Synclet will operate at.
 * @param storageName The base sessionStorage key (used for both connectors if
 * options not provided).
 * @param options Optional configuration to use separate storage keys.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createSessionStorageConnectors
