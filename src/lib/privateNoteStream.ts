// Bearer auth stays in the header. No token in URLs, EventSource query parameters or storage.
export interface StreamEvent {
  event: string;
  data: string;
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
    const error = new Error('알림 연결을 복구하고 있습니다.') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const event of parser.feed(decoder.decode(value, { stream: true }))) onEvent(event);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
