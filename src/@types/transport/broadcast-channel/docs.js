/**
 * The transport/broadcast-channel module documents BroadcastChannel-based
 * transports for browsers.
 * @packageDocumentation
 * @module transport/broadcast-channel
 * @since v0.0.0
 */
/// transport/broadcast-channel

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
 * origin. It
 * uses the browser's BroadcastChannel API for efficient, same-origin
 * communication without requiring a server.
 *
 * The transport is only available in browser environments that support the
 * BroadcastChannel API (all modern browsers). It provides automatic
 * fragmentation for large packets and bidirectional communication between all
 * contexts sharing the same channel name.
 *
 * This is ideal for synchronizing state across multiple tabs or windows of the
 * same web application without server involvement.
 * @param address The address of the local Synclet.
 * @param channelName The name of the BroadcastChannel to use.
 * @param fragmentSize Optional maximum packet size in bytes before
 * fragmentation.
 * @returns A BroadcastChannelTransport instance for cross-tab
 *   communication.
 * @category Transport
 * @since v0.0.0
 */
/// createBroadcastChannelTransport
