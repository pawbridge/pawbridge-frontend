import type { ReactNode } from 'react';

export interface MyPageListFeedback {
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetched: boolean;
  onRetry: () => void;
}

interface MyPageListStateProps extends MyPageListFeedback {
  label: string;
  children: ReactNode;
}

export default function MyPageListState({
  label,
  isLoading,
  isError,
  isFetching,
  isFetched,
  onRetry,
  children,
}: MyPageListStateProps) {
  if (isLoading && !isFetched) {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="mt-8 rounded-lg bg-gray-50 px-6 py-12 text-center dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">{label} 불러오는 중입니다.</p>
      </div>
    );
  }

  // 최초 조회 실패 후 재시도 중에도 같은 안내와 버튼을 유지한다.
  // 갱신 실패 시에는 오래된 목록으로 작업하지 않도록 재시도를 먼저 안내한다.
  if (isError || (isLoading && isFetched)) {
    return (
      <div role="alert" className="mt-8 rounded-lg border border-border-light px-6 py-12 text-center dark:border-border-dark">
        <p className="text-lg font-bold text-text-main dark:text-white">{label} 불러오지 못했어요</p>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          연결 상태를 확인한 뒤 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isFetching}
          className="mt-6 min-h-12 rounded-lg bg-brand px-7 text-sm font-bold text-brand-ink hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-focus disabled:cursor-wait disabled:opacity-60"
        >
          {isFetching ? '다시 불러오는 중...' : '다시 시도'}
        </button>
      </div>
    );
  }

  return children;
}
