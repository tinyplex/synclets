/**
 * The connector/memory module provides volatile connectors for tests, demos,
 * and ephemeral synclets.
 * @packageDocumentation
 * @module connector/memory
 * @since v0.0.0
 */
/// connector/memory

/**
 * The createMemoryDataConnector function creates an in-memory DataConnector
 * that stores Atom data in a JavaScript Map.
 *
 * This connector provides fast, volatile storage that exists only during the
 * current process lifetime. Data is lost when the process terminates or the
 * Synclet is destroyed. It is primarily useful for testing, demos, temporary
 * state, or as a fast cache layer in combination with persistent connectors.
 *
 * The connector works in any JavaScript environment (Node.js, browsers, etc.)
 * and has no external dependencies.
 * @category Connector
 * @since v0.0.0
 */
/// createMemoryDataConnector

/**
 * The createMemoryMetaConnector function creates an in-memory MetaConnector
 * that stores Timestamp metadata in a JavaScript Map.
 *
 * This connector provides fast, volatile metadata storage that mirrors the
 * data tree structure but contains HLC timestamps for conflict resolution.
 * Like the data connector, it is primarily useful for testing, demos, or
 * temporary state.
 *
 * The connector works in any JavaScript environment and has no external
 * dependencies.
 * @category Connector
 * @since v0.0.0
 */
/// createMemoryMetaConnector

/**
 * The createMemoryConnectors function creates both an in-memory DataConnector
 * and MetaConnector together in a single call, returning them as a tuple.
 *
 * This is the simplest way to create a fully functional Synclet with no
 * persistence, making it ideal for testing, prototyping, or scenarios where
 * data should not survive process restarts. Both connectors store their data in
 * JavaScript Maps for fast access.
 *
 * These are the default connectors used by createSynclet when no connectors are
 * explicitly provided.
 * @param depth The tree depth the Synclet will operate at.
 * @returns A tuple of [DataConnector, MetaConnector].
 * @category Connector
 * @since v0.0.5
 */
/// createMemoryConnectors
