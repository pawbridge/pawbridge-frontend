const issuanceIntervalMs = 2100; // Server guard is 2s; include a small timing margin.
const maxAttempts = 3;
type TimingStorage = Pick<Storage, 'getItem' | 'setItem'>;
type TicketEnvironment = {
  storage?: TimingStorage;
  locks?: Pick<LockManager, 'request'>;
  now?: () => number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
};

function waitForIssuance(milliseconds: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

function rateLimited(failure: unknown): boolean {
  if (!failure || typeof failure !== 'object' || !('response' in failure)) return false;
  const response = failure.response;
  return !!response && typeof response === 'object' && 'status' in response && response.status === 429;
}

export function createChatTicketIssuer({ storage, locks, now = Date.now, wait = waitForIssuance }: TicketEnvironment = {}) {
  let memoryOwner: number | undefined;
  let memoryDeadline = 0;
  return async function issue<T>(memberId: number, signal: AbortSignal, request: () => Promise<T>): Promise<T> {
    const key = `pawbridge-chat-ticket-next-v1:${memberId}`;
    const deadline = () => {
      let value = memoryOwner === memberId ? memoryDeadline : 0;
      try { value = Math.max(value, Number(storage?.getItem(key)) || 0); } catch { /* Storage may be disabled. */ }
      // Ignore corrupt or stale clock values instead of delaying connection indefinitely.
      return Number.isFinite(value) && value <= now() + 10000 ? value : 0;
    };
    const remember = () => {
      memoryOwner = memberId;
      memoryDeadline = now() + issuanceIntervalMs;
      try { storage?.setItem(key, String(memoryDeadline)); } catch { /* Keep this document's timing. */ }
    };
    const connect = async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        signal.throwIfAborted();
        // Re-read after waking: another tab may have reserved the next issuance slot.
        while (deadline() > now()) {
          await wait(deadline() - now(), signal);
          signal.throwIfAborted();
        }
        signal.throwIfAborted();
        remember(); // Survives a reload while the request is still in flight.
        try {
          const ticket = await request();
          remember(); // Anchor the cooldown after the server response, not before the request.
          signal.throwIfAborted();
          return ticket;
        } catch (failure) {
          remember();
          signal.throwIfAborted();
          if (!rateLimited(failure) || attempt === maxAttempts - 1) throw failure;
        }
      }
      throw new Error('채팅 연결 인증을 완료하지 못했습니다.');
    };
    // Same-origin tabs serialize issuance; independent browsers still obey the server guard.
    if (!locks) return connect();
    let started = false;
    try {
      return await locks.request(key, { signal }, () => { started = true; return connect(); });
    } catch (failure) {
      if (!started && failure instanceof DOMException && failure.name === 'SecurityError') return connect();
      throw failure;
    }
  };
}

let browserIssuer: ReturnType<typeof createChatTicketIssuer> | undefined;
export function requestChatTicket<T>(memberId: number, signal: AbortSignal, request: () => Promise<T>): Promise<T> {
  if (!browserIssuer) {
    let storage: TimingStorage | undefined;
    let locks: Pick<LockManager, 'request'> | undefined;
    try { storage = window.localStorage; } catch { /* Private storage policies may reject access. */ }
    try { locks = navigator.locks; } catch { /* Origin policies may deny cross-tab locks. */ }
    browserIssuer = createChatTicketIssuer({ storage, locks });
  }
  return browserIssuer(memberId, signal, request);
}
