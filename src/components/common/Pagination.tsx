interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPagination?: boolean; // 데이터가 있을 때만 표시할지 여부
}

export default function Pagination({ currentPage, totalPages, onPageChange, showPagination = true }: PaginationProps) {
  // 데이터가 없거나 페이지가 1개 이하면 표시하지 않음
  if (!showPagination || totalPages <= 1) {
    return null;
  }

  // 페이지 번호 계산 (현재 페이지 기준 앞뒤 2페이지씩 표시, 최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPages = Math.min(5, totalPages);
    let startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, startPage + maxPages - 1);
    
    // 끝에서 시작점 조정
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(0, endPage - maxPages + 1);
    }

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      pages.push(pageNum);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  return (
    <nav className="flex items-center justify-center pt-10 mt-10 border-t border-border-light dark:border-border-dark">
      <ul className="flex items-center -space-x-px h-10 text-base">
        {/* 이전 버튼 */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirstPage}
            className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-s-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
        </li>

        {/* 페이지 번호 */}
        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <li key={`page-${pageNum}`}>
              <button
                onClick={() => onPageChange(pageNum)}
                className={`flex items-center justify-center px-4 h-10 leading-tight transition-colors ${
                  isActive
                    ? 'text-primary bg-primary/20 border border-primary dark:border-primary font-bold'
                    : 'text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white'
                }`}
                aria-label={`${pageNum + 1}페이지`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum + 1}
              </button>
            </li>
          );
        })}

        {/* 다음 버튼 */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLastPage}
            className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-e-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

