/// transport/memory

import type {Transport, TransportOptions} from '../../index.d.ts';

export function createMemoryTransport(
  options?: TransportOptions & {poolId?: string},
): Promise<Transport>;
