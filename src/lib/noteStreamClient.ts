const storageKey = 'pawbridge-note-stream-client-v1';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type TabStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createNoteStreamClientId(
  storage: TabStorage | undefined,
  navigationType: string | undefined,
  randomUUID: () => string,
): string {
  let previous: string | null = null;
  try { previous = storage?.getItem(storageKey) ?? null; } catch { /* Storage can be disabled. */ }
  // A new document navigation gets a fresh identity, including opener-copied sessionStorage.
  // A reload reuses this tab's identity so it can replace only its previous stream.
  const id = navigationType === 'reload' && previous && uuidPattern.test(previous)
    ? previous : randomUUID();
  try { storage?.setItem(storageKey, id); } catch { /* Keep this document's in-memory identity. */ }
  return id;
}

let documentClientId: string | undefined;
export function getNoteStreamClientId(): string {
  if (documentClientId) return documentClientId;
  let storage: TabStorage | undefined;
  try { storage = window.sessionStorage; } catch { /* Private storage policies may reject access. */ }
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  documentClientId = createNoteStreamClientId(storage, navigation?.type, () => crypto.randomUUID());
  return documentClientId;
}
