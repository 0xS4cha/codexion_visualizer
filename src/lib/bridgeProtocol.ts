export type BridgeMessage =
  | { type: 'meta'; version?: string; command?: string | null; exec?: boolean }
  | { type: 'lines'; lines: string[] }
  | { type: 'reset' }
  | { type: 'eof'; code?: number | null; signal?: number | null };

export function parseBridgeMessage(data: string): BridgeMessage | null {
  if (!data.startsWith('{"type"')) return null;
  try {
    const msg = JSON.parse(data) as BridgeMessage;
    if (msg && typeof msg === 'object' && typeof msg.type === 'string') return msg;
  } catch {
    return null;
  }
  return null;
}
