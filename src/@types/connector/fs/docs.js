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
