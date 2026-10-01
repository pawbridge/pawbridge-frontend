import { useRef, useState } from 'react';
import StatsDialog from '../statistics/StatsDialog';
import { adminControl, adminPrimary } from './AdminUI';

export default function AdminDeleteDialog({ name, run, refresh, onClose }: { name: string; run: () => Promise<unknown>; refresh: () => Promise<unknown>; onClose: () => void }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const execute = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await run();
      setUncertain(true); // A confirmed delete must never be repeated if the refresh fails.
      await refresh();
      onClose();
    } catch { setUncertain(true); }
    finally { lock.current = false; setBusy(false); }
  };
  const recover = async () => {
    setBusy(true); setRefreshFailed(false);
    try { await refresh(); onClose(); }
    catch { setRefreshFailed(true); }
    finally { setBusy(false); }
  };
  return <StatsDialog compact title="삭제하시겠어요?" busy={busy} onClose={onClose}>
    <div className="space-y-4">
      <p className="break-words [overflow-wrap:anywhere]">{name}</p>
      <p className="text-sm text-brand-muted">삭제한 정보는 되돌릴 수 없습니다.</p>
      {uncertain && <p role="alert" className="text-sm text-red-700">처리 후 최신 상태를 확인해야 합니다. 삭제 요청을 반복하지 말고 목록을 확인해 주세요.</p>}
      {refreshFailed && <p role="alert" className="text-sm text-red-700">최신 정보 조회에 실패했습니다. 잠시 후 다시 확인해 주세요.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={onClose} className={adminControl}>취소</button>
        {uncertain ? <button type="button" disabled={busy} onClick={recover} className={adminPrimary}>최신 목록 확인</button> : <button type="button" disabled={busy} onClick={execute} className={`${adminPrimary} !bg-red-100 !text-red-800`}>{busy ? '삭제 중…' : '삭제'}</button>}
      </div>
    </div>
  </StatsDialog>;
}
