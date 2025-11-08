/// transport/memory

import type {Transport, TransportOptions} from '../../index.d.ts';

/// createMemoryTransport
export function createMemoryTransport(
  options?: TransportOptions & {poolId?: string},
): Transport;
