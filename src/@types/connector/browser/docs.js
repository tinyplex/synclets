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
 * The createLocalStorageDataConnector function creates a
 * LocalStorageDataConnector instance.
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
 * The createLocalStorageMetaConnector function creates a
 * LocalStorageMetaConnector instance.
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
 * The createLocalStorageConnectors function creates both localStorage-backed
 * DataConnector and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param storageName The base storage key (used for both if options not
 * provided).
 * @param options Configuration for both connectors.
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
 * The createSessionStorageDataConnector function creates a
 * SessionStorageDataConnector instance.
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
 * The createSessionStorageMetaConnector function creates a
 * SessionStorageMetaConnector instance.
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
 * The createSessionStorageConnectors function creates both sessionStorage-
 * backed DataConnector and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param storageName The base storage key (used for both if options not
 * provided).
 * @param options Configuration for both connectors.
 * @category Connector
 * @since v0.0.5
 */
/// createSessionStorageConnectors
