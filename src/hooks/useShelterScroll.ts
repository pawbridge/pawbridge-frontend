import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { readShelterView, saveShelterView } from '../utils/shelterView';

export default function useShelterScroll(ready: boolean, resetOnMount = false) {
  const location = useLocation();
  const navigation = useNavigationType();
  const snapshot = useRef<number | undefined>(undefined);
  const applied = useRef(false);
  const firstEntry = useRef(true);
  const restoreKey = typeof location.state?.shelterRestoreKey === 'string' ? location.state.shelterRestoreKey : undefined;
  useLayoutEffect(() => {
    snapshot.current = restoreKey || navigation === 'POP'
      ? readShelterView(restoreKey || location.key)?.scrollY : undefined;
    applied.current = false;
    if (firstEntry.current && resetOnMount && snapshot.current === undefined) window.scrollTo({ top: 0, behavior: 'instant' });
    firstEntry.current = false;
    const save = () => saveShelterView(location.key, { scrollY: window.scrollY });
    window.addEventListener('scroll', save, { passive: true });
    return () => { window.removeEventListener('scroll', save); save(); };
  }, [location.key, restoreKey, navigation, resetOnMount]);
  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    if (snapshot.current !== undefined) window.scrollTo({ top: snapshot.current, behavior: 'instant' });
  }, [location.key, ready]);
}
