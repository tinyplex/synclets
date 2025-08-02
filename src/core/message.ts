import {getUniqueId, mapEnsure, mapNew} from '@synclets/utils';
import {Message} from './protected.js';

export const newFragmentsBuffer = (): Map<
  string,
  [fragments: string[], awaiting: Set<number>]
> => mapNew();

export const getMessageFromPackets = async (
  packet: string,
  fragmentsBuffer: Map<string, [string[], Set<number>]>,
  onComplete: (message: Message) => Promise<void>,
) => {
  const [messageId, fragmentIndexString, fragmentsCountString, fragment] =
    packet.split('\n');
  const fragmentIndex = parseInt(fragmentIndexString);
  const fragmentsCount = parseInt(fragmentsCountString);

  const [fragments, awaiting] = mapEnsure(fragmentsBuffer, messageId, () => {
    const fragments = new Array(fragmentsCount).fill('');
    return [
      fragments,
      new Set(fragments.map((_, fragmentIndex) => fragmentIndex)),
    ];
  });

  fragments[fragmentIndex] = fragment;
  awaiting.delete(fragmentIndex);

  if (awaiting.size == 0) {
    fragmentsBuffer.delete(messageId);
    await onComplete(JSON.parse(fragments.join(',')));
  }
};

export const getPacketsFromMessage = (message: Message): string[] => {
  const messageId = getUniqueId();
  const fragments = JSON.stringify(message).split(',');
  const fragmentsCount = fragments.length;
  return fragments.map((fragment, fragmentIndex) =>
    [messageId, fragmentIndex, fragmentsCount, fragment].join('\n'),
  );
};
