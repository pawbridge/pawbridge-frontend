/** Cross-tab coordination only. The HTTP-only cookie remains the identity source. */
const LOCK_NAME = 'pb-visit-bootstrap';
const DB_NAME = 'pb-visit-bootstrap';
const STORE = 'locks';
const LEASE_MS = 30_000; // Longer than the two bounded 8-second HTTP requests.
const WAIT_MS = 35_000;
type Lease = { owner: string; until: number };

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Bootstrap storage unavailable'));
    request.onblocked = () => reject(new Error('Bootstrap storage blocked'));
  });
}
function changeLease(db: IDBDatabase, owner: string, release: boolean): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    const request = store.get(LOCK_NAME);
    let changed = false;
    request.onsuccess = () => {
      const lease = request.result as Lease | undefined;
      if (release) {
        if (lease?.owner === owner) store.delete(LOCK_NAME);
      } else if (!lease || lease.until <= Date.now()) {
        store.put({ owner, until: Date.now() + LEASE_MS }, LOCK_NAME);
        changed = true;
      }
    };
    transaction.oncomplete = () => resolve(changed);
    transaction.onabort = () => reject(new Error('Bootstrap transaction aborted'));
    transaction.onerror = () => reject(new Error('Bootstrap transaction failed'));
  });
}
async function withDatabaseLock<T>(operation: () => Promise<T>): Promise<T> {
  let db: IDBDatabase;
  try { db = await openDatabase(); }
  catch {
    // Both mechanisms unavailable: still count cookie-based visits, with a documented
    // first-tab race limitation. Do not invent an IP/device identity or drop these users.
    return operation();
  }
  const owner = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  const deadline = performance.now() + WAIT_MS;
  try {
    while (!await changeLease(db, owner, false)) {
      if (performance.now() >= deadline) throw new Error('Bootstrap lock timed out');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    try { return await operation(); }
    finally { await changeLease(db, owner, true); }
  } finally { db.close(); }
}
export async function withVisitLock<T>(operation: () => Promise<T>): Promise<T> {
  if (navigator.locks?.request) {
    // A timed-out wait is not permission to bypass another tab's active lock.
    let acquired = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WAIT_MS);
    try {
      return await navigator.locks.request(LOCK_NAME, { signal: controller.signal }, () => {
        acquired = true;
        return operation();
      });
    } catch (failure) {
      if (acquired || !(failure instanceof DOMException)
        || !['SecurityError', 'NotSupportedError'].includes(failure.name)) throw failure;
      // An API that exists but is denied must still have a safe coordination alternative.
    } finally { clearTimeout(timer); }
  }
  return withDatabaseLock(operation);
}

export function isPublicVisitPath(pathname: string): boolean {
  if (/(\/new|\/edit)$/.test(pathname)) return false;
  return pathname === '/' || /^\/(animals|shelters|travel|adoption|community|reports)(\/|$)/.test(pathname);
}
export function visitCountingEnabled(environment: string | undefined, enabled: string | undefined,
  testMode: string | undefined, hostname: string): boolean {
  if (enabled !== 'true') return false;
  return environment === 'prod' && hostname === 'www.pawbridge.kr'
    || testMode === 'true' && ['localhost', '127.0.0.1'].includes(hostname);
}
