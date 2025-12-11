import { useState, useEffect } from 'react';
import type { ProductSearchParams } from '../../types/api.types';

interface ProductFilterSidebarProps {
  filters: ProductSearchParams;
  onFilterChange: (filters: ProductSearchParams) => void;
  onReset: () => void;
}

// 카테고리 정의 (디자인 HTML 아이콘과 일치)
const categories = [
  { id: 1, name: '사료 및 간식', icon: 'skeleton' },
  { id: 2, name: '장난감', icon: 'stadia_controller' },
  { id: 3, name: '위생/미용 용품', icon: 'spark' },
  { id: 4, name: '의류/액세서리', icon: 'checkroom' },
  { id: 5, name: '굿즈', icon: 'storefront' },
];

export default function ProductFilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: ProductFilterSidebarProps) {
  // 로컬 상태 (입력 중인 값 저장 - 엔터/버튼 클릭 전까지 검색 안 함)
  const [localKeyword, setLocalKeyword] = useState(filters.keyword || '');
  const [localMinPrice, setLocalMinPrice] = useState<string>(filters.minPrice?.toString() || '');
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(filters.maxPrice?.toString() || '');

  // 외부 filters가 변경되면 로컬 상태도 업데이트 (초기화 등)
  useEffect(() => {
    setLocalKeyword(filters.keyword || '');
    setLocalMinPrice(filters.minPrice?.toString() || '');
    setLocalMaxPrice(filters.maxPrice?.toString() || '');
  }, [filters.keyword, filters.minPrice, filters.maxPrice]);

  // 카테고리 선택 (즉시 검색)
  const handleCategoryClick = (categoryId: number | undefined) => {
    onFilterChange({
      ...filters,
      categoryId,
      page: 0,
    });
  };

  // 엔터키로 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 재고 필터 (즉시 검색)
  const handleStockFilter = (inStockOnly: boolean) => {
    onFilterChange({
      ...filters,
      inStockOnly: inStockOnly || undefined,
      page: 0,
    });
  };

  // 검색 버튼 클릭 (키워드 + 가격 모두 반영)
  const handleSearch = () => {
    onFilterChange({
      ...filters,
      keyword: localKeyword || undefined,
      minPrice: localMinPrice ? Number(localMinPrice) : undefined,
      maxPrice: localMaxPrice ? Number(localMaxPrice) : undefined,
      page: 0,
    });
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex flex-col gap-6 p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm">
        {/* 검색 */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="상품 검색..."
            className="form-input w-full min-w-0 flex-1 resize-none overflow-hidden rounded-full text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-background-light dark:bg-secondary-dark h-10 placeholder:text-gray-500 pl-10 pr-4 text-sm font-normal"
          />
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          className="w-full h-10 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          검색
        </button>

        {/* 카테고리 */}
        <div>
          <h3 className="text-base font-bold text-text-accent-light dark:text-text-accent-dark px-3 mb-2">
            카테고리
          </h3>
          <div className="flex flex-col gap-1">
            {/* 전체 카테고리 */}
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                !filters.categoryId
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-secondary-light dark:hover:bg-secondary-dark'
              }`}
            >
              <span className="material-symbols-outlined">grid_view</span>
              <p className={`text-sm ${!filters.categoryId ? 'font-bold' : 'font-medium'}`}>
                전체
              </p>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                  filters.categoryId === category.id
                    ? 'bg-primary/20 text-primary'
                    : 'hover:bg-secondary-light dark:hover:bg-secondary-dark'
                }`}
              >
                <span className="material-symbols-outlined">{category.icon}</span>
                <p className={`text-sm ${filters.categoryId === category.id ? 'font-bold' : 'font-medium'}`}>
                  {category.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 재고 필터 */}
        <div>
          <h3 className="text-base font-bold text-text-accent-light dark:text-text-accent-dark px-3 mb-2">
            재고
          </h3>
          <label className="flex items-center gap-2 px-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStockOnly || false}
              onChange={(e) => handleStockFilter(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">재고 있는 상품만</span>
          </label>
        </div>

        {/* 가격 필터 */}
        <div>
          <h3 className="text-base font-bold text-text-accent-light dark:text-text-accent-dark px-3 mb-2">
            가격대
          </h3>
          <div className="flex gap-2 px-3">
            <input
              type="number"
              placeholder="최소"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-background-light dark:bg-secondary-dark text-sm"
            />
            <span className="self-center text-gray-400">~</span>
            <input
              type="number"
              placeholder="최대"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-background-light dark:bg-secondary-dark text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 px-3 mt-1">엔터 또는 검색 버튼으로 적용</p>
        </div>

        {/* 필터 초기화 */}
        <button
          onClick={onReset}
          className="w-full h-10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          필터 초기화
        </button>
      </div>
    </aside>
  );
}

