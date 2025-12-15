/**
 * The fs module documents file- and directory-backed connector types
 * for Node environments.
 * @packageDocumentation
 * @module fs
 * @since v0.0.0
 */
/// fs

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
 * The FileDataConnectorOptions type specifies configuration for creating a
 * file-backed DataConnector.
 * @category Connector
 * @since v0.0.0
 */
/// FileDataConnectorOptions
{
  /**
   * The dataFile property specifies the file path for data storage.
   * @category Option
   * @since v0.0.0
   */
  /// FileDataConnectorOptions.dataFile
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
 * The FileMetaConnectorOptions type specifies configuration for creating a
 * file-backed MetaConnector.
 * @category Connector
 * @since v0.0.0
 */
/// FileMetaConnectorOptions
{
  /**
   * The metaFile property specifies the file path for metadata storage.
   * @category Option
   * @since v0.0.0
   */
  /// FileMetaConnectorOptions.metaFile
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
 * The FileSyncletOptions type specifies configuration for creating a
 * file-backed Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// FileSyncletOptions
{
  /**
   * The transport property specifies the Transport instance for
   * synchronization.
   * @category Option
   * @since v0.0.0
   */
  /// FileSyncletOptions.transport
  /**
   * The implementations property optionally specifies custom conflict
   * resolution implementations.
   * @category Option
   * @since v0.0.0
   */
  /// FileSyncletOptions.implementations
}

/**
 * The createFileSynclet function creates a file-backed Synclet with both data
 * and metadata persistence in a single call.
 *
 * This is the recommended approach for file-based persistence in Node.js. The
 * function provides a simplified API that creates both the DataConnector and
 * MetaConnector internally, along with the Synclet instance.
 * @param options Configuration object specifying file paths, transport, and
 * other Synclet options.
 * @returns A Promise resolving to the configured Synclet instance.
 * @category Connector
 * @since v0.0.0
 */
/// createFileSynclet

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
 * The DirectoryDataConnectorOptions type specifies configuration for creating a
 * directory-backed DataConnector.
 * @category Connector
 * @since v0.0.0
 */
/// DirectoryDataConnectorOptions
{
  /**
   * The dataDirectory property specifies the directory path for data storage.
   * @category Option
   * @since v0.0.0
   */
  /// DirectoryDataConnectorOptions.dataDirectory
}

/**
 * The createDirectoryDataConnector function creates a DataConnector that
 * persists Atom data across multiple individual files within a directory.
 *
 * Each leaf address in the data tree is stored as a separate file, with the
 * file path reflecting the address hierarchy. This approach is more scalable
 * than file-based storage for large datasets, as only modified values need to
 * be read or written rather than the entire tree.
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
 * The DirectoryMetaConnectorOptions type specifies configuration for creating a
 * directory-backed MetaConnector.
 * @category Connector
 * @since v0.0.0
 */
/// DirectoryMetaConnectorOptions
{
  /**
   * The metaDirectory property specifies the directory path for metadata
   * storage.
   * @category Option
   * @since v0.0.0
   */
  /// DirectoryMetaConnectorOptions.metaDirectory
}

/**
 * The createDirectoryMetaConnector function creates a MetaConnector that
 * persists Timestamp metadata across multiple individual files within a
 * directory.
 *
 * Each leaf address in the metadata tree is stored as a separate file,
 * mirroring the data tree structure. This approach provides better scalability
 * for large datasets compared to storing all timestamps in a single file.
 *
 * The directory structure is created automatically. This connector is designed
 * for Node.js environments and requires file system access.
 * @category Connector
 * @since v0.0.0
 */
/// createDirectoryMetaConnector

/**
 * The DirectorySyncletOptions type specifies configuration for creating a
 * directory-backed Synclet.
 * @category Connector
 * @since v0.0.0
 */
/// DirectorySyncletOptions
{
  /**
   * The transport property specifies the Transport instance for
   * synchronization.
   * @category Option
   * @since v0.0.0
   */
  /// DirectorySyncletOptions.transport
  /**
   * The implementations property optionally specifies custom conflict
   * resolution implementations.
   * @category Option
   * @since v0.0.0
   */
  /// DirectorySyncletOptions.implementations
}

/**
 * The createDirectorySynclet function creates a directory-backed Synclet with
 * both data and metadata persistence in a single call.
 *
 * This is the recommended approach for directory-based persistence in Node.js,
 * particularly for large datasets that benefit from granular file storage. The
 * function provides a simplified API that creates both the DataConnector and
 * MetaConnector internally, along with the Synclet instance.
 * @param options Configuration object specifying directory paths, transport,
 * and other Synclet options.
 * @returns A Promise resolving to the configured Synclet instance.
 * @category Connector
 * @since v0.0.0
 */
/// createDirectorySynclet
