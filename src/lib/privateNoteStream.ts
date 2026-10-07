// Bearer auth stays in the header. No token in URLs, EventSource query parameters or storage.
export interface StreamEvent {
  event: string;
  data: string;
}

export function retryAfterMilliseconds(value: string | null, now = Date.now()): number | undefined {
  if (value === null || value.length > 128) return undefined;
  const header = value.trim();
  let milliseconds: number;
  if (/^\d{1,3}$/.test(header)) {
    milliseconds = Number(header) * 1000;
  } else if (/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(header)) {
    const timestamp = Date.parse(header);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toUTCString() !== header) return undefined;
    milliseconds = timestamp - now;
  } else {
    return undefined;
  }
  // A malformed or unreasonable server hint must not create a tight loop or an unbounded timer.
  if (!Number.isFinite(milliseconds) || milliseconds < 0 || milliseconds > 300_000) return undefined;
  return Math.max(1000, Math.ceil(milliseconds));
}

export class NoteStreamError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | undefined;
  constructor(status: number, retryAfterMs?: number) {
    super('알림 연결을 복구하고 있습니다.');
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export function noteStreamRetryDelay(failure: unknown, delay: number, random = Math.random): number {
  const wait = failure instanceof NoteStreamError && failure.status === 429
    ? (failure.retryAfterMs ?? 30_000)
    : delay;
  // Add jitter after the server's minimum delay, never before it.
  return wait + Math.floor(random() * 1000);
}
export class SseParser {
  private buffer = '';
  feed(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    if (this.buffer.length > 65536) throw new Error('알림 수신 크기를 초과했습니다.');
    const events: StreamEvent[] = [];
    let boundary: RegExpExecArray | null;
    while ((boundary = /\r?\n\r?\n/.exec(this.buffer)) !== null) {
      const frame = this.buffer.slice(0, boundary.index);
      this.buffer = this.buffer.slice(boundary.index + boundary[0].length);
      let event = 'message';
      const data: string[] = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith(':')) continue;
        const colon = line.indexOf(':');
        const key = colon < 0 ? line : line.slice(0, colon);
        const raw = colon < 0 ? '' : line.slice(colon + 1);
        const value = raw.startsWith(' ') ? raw.slice(1) : raw;
        if (key === 'event') event = value;
        if (key === 'data') data.push(value);
      }
      if (data.length) events.push({ event, data: data.join('\n') });
    }
    return events;
  }
}

export async function consumeNoteStream(
  url: string,
  token: string,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => void,
) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
    cache: 'no-store',
  });
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get('content-type')?.startsWith('text/event-stream')
  ) {
    const retryAfter = response.status === 429
      ? retryAfterMilliseconds(response.headers.get('retry-after'))
      : undefined;
    await response.body?.cancel().catch(() => undefined);
    throw new NoteStreamError(response.status, retryAfter);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const event of parser.feed(decoder.decode(value, { stream: true }))) {
        if (signal.aborted) break;
        onEvent(event);
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
