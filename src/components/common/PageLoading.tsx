// 화면 코드를 받아 오는 동안의 상태 문구. 대개 순간이라 눈에 보이는 표시 없이 화면 읽기 프로그램용 문구만 둔다.
export function PageLoadingStatus() {
  return <p role="status" className="sr-only">화면을 불러오는 중입니다.</p>;
}

// 본문(main) 자리를 비워 둔 채 기다린다. 헤더·푸터는 그대로라 화면이 흔들리지 않는다.
// fullScreen은 공통 틀 없이 화면 전체를 쓸 때(App 최상위).
export default function PageLoading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <main aria-busy="true" className={`w-full flex-1 ${fullScreen ? 'min-h-screen bg-background-light dark:bg-background-dark' : ''}`}>
      <PageLoadingStatus />
    </main>
  );
}
