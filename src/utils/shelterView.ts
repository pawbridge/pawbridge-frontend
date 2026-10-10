interface ShelterView { scrollY: number; expanded: number[] }
// Bounded, tab-local navigation snapshots. Animal/filter data stays in the URL/query cache.
const views = new Map<string, ShelterView>();

export function readShelterView(key: string): ShelterView | undefined {
  const value = views.get(key);
  return value ? { scrollY: value.scrollY, expanded: [...value.expanded] } : undefined;
}

export function saveShelterView(key: string, patch: Partial<ShelterView>) {
  const current = views.get(key) || { scrollY: 0, expanded: [] };
  views.delete(key);
  views.set(key, { ...current, ...patch });
  if (views.size > 20) views.delete(views.keys().next().value!);
}
