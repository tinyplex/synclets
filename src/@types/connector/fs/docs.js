/**
 * The connector/fs module documents file- and directory-backed connector types
 * for Node environments.
 * @packageDocumentation
 * @module connector/fs
 * @since v0.0.0
 */
/// connector/fs

/**
 * The FileDataConnector interface describes a DataConnector backed by a single
 * file.
 * @category Connector
 * @since v0.0.0
 */
/// FileDataConnector
{
  /**
   * The getFile method returns the path to the backing data file.
   * @category Accessor
   * @since v0.0.0
   */
  /// FileDataConnector.getFile
}

/**
 * The createFileDataConnector function creates a FileDataConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createFileDataConnector

/**
 * The FileMetaConnector interface describes a MetaConnector backed by a single
 * file.
 * @category Connector
 * @since v0.0.0
 */
/// FileMetaConnector
{
  /**
   * The getFile method returns the path to the backing metadata file.
   * @category Accessor
   * @since v0.0.0
   */
  /// FileMetaConnector.getFile
}

/**
 * The createFileMetaConnector function creates a FileMetaConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createFileMetaConnector

/**
 * The FileConnectorsOptions type specifies configuration for both data and
 * meta connectors when using createFileConnectors.
 * @category Connector
 * @since v0.0.5
 */
/// FileConnectorsOptions
{
  /**
   * The dataFile property specifies the file path for data storage.
   * @category Option
   * @since v0.0.5
   */
  /// FileConnectorsOptions.dataFile
  /**
   * The metaFile property specifies the file path for metadata storage.
   * @category Option
   * @since v0.0.5
   */
  /// FileConnectorsOptions.metaFile
}

/**
 * The createFileConnectors function creates both file-backed DataConnector
 * and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param file The base file path (used for both if options not provided).
 * @param options Configuration for both connectors.
 * @category Connector
 * @since v0.0.5
 */
/// createFileConnectors

/**
 * The DirectoryDataConnector interface describes a DataConnector that stores
 * data in a directory.
 * @category Connector
 * @since v0.0.0
 */
/// DirectoryDataConnector
{
  /**
   * The getDirectory method returns the directory containing data files.
   * @category Accessor
   * @since v0.0.0
   */
  /// DirectoryDataConnector.getDirectory
}

/**
 * The createDirectoryDataConnector function creates a
 * DirectoryDataConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createDirectoryDataConnector

/**
 * The DirectoryMetaConnector interface describes a MetaConnector that stores
 * metadata in a directory.
 * @category Connector
 * @since v0.0.0
 */
/// DirectoryMetaConnector
{
  /**
   * The getDirectory method returns the directory containing metadata files.
   * @category Accessor
   * @since v0.0.0
   */
  /// DirectoryMetaConnector.getDirectory
}

/**
 * The createDirectoryMetaConnector function creates a
 * DirectoryMetaConnector instance.
 * @category Connector
 * @since v0.0.0
 */
/// createDirectoryMetaConnector

/**
 * The DirectoryConnectorsOptions type specifies configuration for both data
 * and meta connectors when using createDirectoryConnectors.
 * @category Connector
 * @since v0.0.5
 */
/// DirectoryConnectorsOptions
{
  /**
   * The dataDirectory property specifies the directory path for data storage.
   * @category Option
   * @since v0.0.5
   */
  /// DirectoryConnectorsOptions.dataDirectory
  /**
   * The metaDirectory property specifies the directory path for metadata
   * storage.
   * @category Option
   * @since v0.0.5
   */
  /// DirectoryConnectorsOptions.metaDirectory
}

/**
 * The createDirectoryConnectors function creates both directory-backed
 * DataConnector and MetaConnector together for convenience.
 * @param depth The depth of the synclet.
 * @param directory The base directory path (used for both if options not
 * provided).
 * @param options Configuration for both connectors.
 * @category Connector
 * @since v0.0.5
 */
/// createDirectoryConnectors
