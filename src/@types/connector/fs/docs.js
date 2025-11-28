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
 * The createFileDataConnector function creates a DataConnector that persists
 * Atom data in a single JSON file on the file system.
 *
 * The entire data tree is stored as a JSON object in the specified file. The
 * file is read on initialization and written atomically after each change,
 * making it suitable for small to medium-sized datasets where the entire tree
 * fits comfortably in memory.
 *
 * This connector is designed for Node.js environments and requires file system
 * access. It will not work in browsers.
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
 * The createFileMetaConnector function creates a MetaConnector that persists
 * Timestamp metadata in a single JSON file on the file system.
 *
 * The metadata tree is stored as a JSON object mirroring the data tree
 * structure but containing HLC timestamps instead of Atom values. The file is
 * read on initialization and written atomically after each timestamp change.
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
 * The createFileConnectors function creates both a file-backed DataConnector
 * and MetaConnector together in a single call, returning them as a tuple.
 *
 * This is the recommended approach for file-based persistence in Node.js. The
 * function provides a simplified API compared to creating the connectors
 * separately.
 *
 * When options are not provided, both data and metadata are stored in the same
 * file. For better organization and to avoid potential conflicts in large
 * datasets, you can specify separate file paths via the options parameter.
 * @param depth The tree depth the Synclet will operate at.
 * @param file The base file path (used for both connectors if options not
 * provided).
 * @param options Optional configuration to use separate file paths.
 * @returns A tuple of [DataConnector, MetaConnector].
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
 * The createDirectoryDataConnector function creates a DataConnector that
 * persists Atom data across multiple individual files within a directory.
 *
 * Each leaf address in the data tree is stored as a separate file, with the
 * file path reflecting the address hierarchy. This approach is more scalable
 * than file-based storage for large datasets, as only modified values need to be
 * read or written rather than the entire tree.
 *
 * The directory structure is created automatically. This connector is designed
 * for Node.js environments and requires file system access.
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
 * The createDirectoryMetaConnector function creates a MetaConnector that
 * persists Timestamp metadata across multiple individual files within a
 * directory.
 *
 * Each leaf address in the metadata tree is stored as a separate file, mirroring
 * the data tree structure. This approach provides better scalability for large
 * datasets compared to storing all timestamps in a single file.
 *
 * The directory structure is created automatically. This connector is designed
 * for Node.js environments and requires file system access.
 * @category Connector
 * @since v0.0.0
 */
/// createDirectoryMetaConnector

/**
 * The createDirectoryConnectors function creates both a directory-backed
 * DataConnector and MetaConnector together in a single call, returning them as
 * a tuple.
 *
 * This is the recommended approach for directory-based persistence in Node.js,
 * particularly for large datasets that benefit from granular file storage. The
 * function provides a simplified API compared to creating the connectors
 * separately.
 *
 * You must provide separate directory paths for data and metadata to avoid
 * naming conflicts.
 * @param depth The tree depth the Synclet will operate at.
 * @param dataDirectory The directory path for data storage.
 * @param metaDirectory The directory path for metadata storage.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createDirectoryConnectors
