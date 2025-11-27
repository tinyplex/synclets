/**
 * The transport/memory module covers the in-process transport used for local
 * testing.
 * @packageDocumentation
 * @module transport/memory
 * @since v0.0.0
 */
/// transport/memory

/**
 * The createMemoryTransport function creates an in-process Transport that
 * delivers packets synchronously within the same JavaScript runtime.
 *
 * This transport does not use any network or IPC mechanism. Instead, it
 * directly invokes receive handlers on other Synclets in the same process.
 * This makes it ideal for testing multi-Synclet scenarios, demos, or cases
 * where multiple independent Synclets need to communicate locally without
 * network overhead.
 *
 * The transport works in any JavaScript environment and has no external
 * dependencies. It is the default transport used by createSynclet when no
 * transport is explicitly provided.
 * @category Transport
 * @since v0.0.0
 */
/// createMemoryTransport
