// 화면별 파일(/assets/<이름>-<해시>.js)은 배포할 때마다 이름이 바뀌고 옛 파일은 사라진다.
// 배포 전에 열어 둔 탭이 아직 받지 않은 화면으로 이동하면 옛 파일을 받지 못하므로,
// 페이지를 한 번 새로 불러와 새 배포의 파일 이름을 받는다.
// 새로 불러온 직후에도 실패하면(파일 서버 장애 등) 반복하지 않고 오류 카드(ErrorBoundary)에 맡긴다.
const RELOADED_AT_KEY = 'pawbridge:stale-chunk-reloaded-at';
// 새로 불러온 뒤 이 시간 안에 다시 실패하면 새로 불러와도 고쳐지지 않는 실패로 본다.
const RETRY_WINDOW_MS = 60_000;

export function installStaleChunkReload(): void {
  // Vite는 화면 파일을 동적으로 받다 실패하면 이 이벤트를 보낸 뒤 오류를 그대로 던진다.
  window.addEventListener('vite:preloadError', () => {
    const now = Date.now();
    try {
      const reloadedAt = Number(sessionStorage.getItem(RELOADED_AT_KEY));
      if (reloadedAt && now - reloadedAt < RETRY_WINDOW_MS) return;
      sessionStorage.setItem(RELOADED_AT_KEY, String(now));
    } catch {
      // 기록할 곳이 없으면 반복 새로고침을 막을 수 없으므로 새로 불러오지 않는다.
      return;
    }
    window.location.reload();
  });
}
