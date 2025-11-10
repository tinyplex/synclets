export const getPartsFromPacket = (
  packet: string,
): [toOrFrom: string, body: string] =>
  (packet.match(/^(.+?) (.+)/) ?? []).slice(1, 3) as [string, string];

export const getPacketFromParts = (toOrFrom: string, body: string): string =>
  `${toOrFrom} ${body}`;
