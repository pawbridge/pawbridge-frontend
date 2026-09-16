import type { LostCandidate, LostSearchInput } from '../api/lostSearch.api';

export interface LostSearchSession extends Omit<LostSearchInput, 'image'> {
  photo: File | null;
  results: LostCandidate[];
  phase: 'idle' | 'success';
  scrollY: number;
}

// One bounded, tab-local snapshot. Never serialize a user's photo to browser storage.
let recent: { entryKey: string; session: LostSearchSession } | undefined;

export function readLostSearchSession(entryKey: string): LostSearchSession | undefined {
  if (recent?.entryKey !== entryKey) return undefined;
  return recent.session;
}

export function saveLostSearchSession(entryKey: string, session: LostSearchSession) {
  recent = { entryKey, session };
}

export function clearLostSearchSession() {
  recent = undefined;
}
