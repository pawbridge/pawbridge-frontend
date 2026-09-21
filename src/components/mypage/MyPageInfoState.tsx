import Header from '../layout/Header';
import Footer from '../layout/Footer';

type MyPageInfoStateProps =
  | { variant: 'loading' }
  | { variant: 'error'; isRetrying: boolean; onRetry: () => void };

export default function MyPageInfoState(props: MyPageInfoStateProps) {
  const loading = props.variant === 'loading';

  return (
    <div className="flex min-h-screen flex-col bg-background-light text-text-main dark:bg-background-dark dark:text-white">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <section role="status" aria-live="polite" aria-busy="true" data-testid="mypage-info-loading">
            <span className="sr-only">마이페이지 정보를 불러오는 중입니다.</span>
            <div aria-hidden="true" className="flex animate-pulse flex-col gap-8 md:flex-row lg:gap-12">
              <div className="md:w-1/4 lg:w-1/5">
                <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800/20">
                  <div className="flex items-center gap-4 border-b border-gray-200 pb-6 dark:border-gray-700">
                    <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="h-3 w-full max-w-36 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[72, 88, 80, 68].map((width) => (
                      <div key={width} className="h-11 rounded-lg bg-gray-100 dark:bg-gray-800" style={{ width: `${width}%` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1 md:w-3/4 lg:w-4/5">
                <div className="mb-6 h-11 w-44 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800/20 sm:p-8">
                  <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="mt-6 border-t border-gray-200 pt-8 dark:border-gray-700">
                    <div className="grid gap-6 md:grid-cols-2">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="space-y-2">
                          <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                          <div className="h-11 rounded-lg bg-gray-100 dark:bg-gray-800" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section aria-labelledby="mypage-heading">
            <h1 id="mypage-heading" className="mb-6 text-3xl font-black leading-tight tracking-[-0.033em] sm:text-4xl">
              마이페이지
            </h1>
            <div
              role="alert"
              aria-labelledby="mypage-error-title"
              className="rounded-xl border border-border-light bg-white px-6 py-12 text-center shadow-sm dark:border-border-dark dark:bg-gray-800/20 sm:px-10 sm:py-16"
            >
              <h2 id="mypage-error-title" className="text-xl font-bold sm:text-2xl">
                마이페이지를 불러오지 못했어요
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-300 sm:text-base">
                연결 상태를 확인한 뒤 다시 시도해 주세요.
              </p>
              <button
                type="button"
                onClick={props.onRetry}
                disabled={props.isRetrying}
                className="mt-7 min-h-12 rounded-lg bg-primary px-7 text-sm font-bold text-primary-content transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
              >
                {props.isRetrying ? '다시 불러오는 중...' : '다시 시도'}
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
