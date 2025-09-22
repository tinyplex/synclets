export const getPartsFromPacket = (
  packet: string,
): [to: string, body: string] =>
  (packet.match(/^(.+?) (.+)/) ?? []).slice(1, 3) as [string, string];

export const getPacketFromParts = (to: string, body: string): string =>
  `${to} ${body}`;
