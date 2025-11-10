/// transport/broadcast-channel
import type {Transport, TransportOptions} from '../../index.js';

/// BroadcastChannelTransport
export interface BroadcastChannelTransport extends Transport {
  /// BroadcastChannelTransport.getChannelName
  getChannelName(): string;
}

/// createBroadcastChannelTransport
export function createBroadcastChannelTransport(
  channelName: string,
  options?: TransportOptions,
): BroadcastChannelTransport;
