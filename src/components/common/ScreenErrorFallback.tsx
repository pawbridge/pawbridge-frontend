// 화면을 그리다 오류가 났을 때의 안내 카드. 모양은 LoginRequiredCard와 같다.
// 라우터 밖(main.tsx 최상위)에서도 쓰므로 Link 대신 <a>로 홈에 간다(앱을 새로 불러와 상태도 초기화).
export function ScreenErrorCard() {
  return (
    <div role="alert" className="mx-auto mt-24 max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200/80 dark:border-gray-700 p-6 flex flex-col gap-4 text-center">
      <p className="text-xl font-bold text-text-light dark:text-text-dark">화면을 표시하지 못했습니다</p>
      <p className="break-keep text-sm text-gray-600 dark:text-gray-400">
        일시적인 문제일 수 있습니다. 새로고침하거나 홈으로 이동해 주세요.
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-brand text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          새로고침
        </button>
        <a
          href="/"
          className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}

// 카드를 화면 본문(main) 자리에 놓는다. fullScreen은 공통 틀 없이 화면 전체를 쓸 때(최상위 경계).
export default function ScreenErrorFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <main className={`w-full flex-1 px-4 ${fullScreen ? 'flow-root min-h-screen bg-background-light font-display dark:bg-background-dark' : ''}`}>
      <ScreenErrorCard />
    </main>
  );
}
