import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, addToCart } from '../api/products.api';
import type { ProductSearchParams } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductFilterSidebar from '../components/common/ProductFilterSidebar';
import ProductCard from '../components/common/ProductCard';

// 카테고리 이름 매핑
const categoryNames: Record<number, string> = {
  1: '사료 및 간식',
  2: '장난감',
  3: '위생/미용 용품',
  4: '의류/액세서리',
  5: '굿즈',
};

export default function Products() {
  const queryClient = useQueryClient();
  
  // 필터 상태
  const [filters, setFilters] = useState<ProductSearchParams>({
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // 상품 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
  });

  // 장바구니 추가 mutation
  const addToCartMutation = useMutation({
    mutationFn: (skuId: number) => addToCart({ skuId, quantity: 1 }),
    onSuccess: () => {
      alert('장바구니에 추가되었습니다!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      alert('장바구니 추가에 실패했습니다. 로그인이 필요합니다.');
    },
  });

  // 필터 변경
  const handleFilterChange = (newFilters: ProductSearchParams) => {
    setFilters({ ...newFilters, page: 0 });
  };

  // 필터 초기화
  const handleReset = () => {
    setFilters({
      page: 0,
      size: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // 정렬 변경
  const handleSortChange = (sortBy: ProductSearchParams['sortBy'], sortOrder: ProductSearchParams['sortOrder']) => {
    setFilters({ ...filters, sortBy, sortOrder, page: 0 });
  };

  // 현재 정렬 상태 확인
  const isActiveSort = (sortBy: ProductSearchParams['sortBy'], sortOrder: ProductSearchParams['sortOrder']) => {
    return filters.sortBy === sortBy && filters.sortOrder === sortOrder;
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 장바구니 추가
  const handleAddToCart = (skuId: number) => {
    addToCartMutation.mutate(skuId);
  };

  // 현재 카테고리 이름
  const currentCategoryName = filters.categoryId 
    ? categoryNames[filters.categoryId] 
    : '전체 상품';

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">상품을 불러오는 중...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
              <p className="text-gray-500">상품을 불러오는데 실패했습니다.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const products = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.currentPage || 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 사이드바 필터 */}
          <ProductFilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />

          {/* 메인 컨텐츠 */}
          <div className="flex-1">
            {/* 제목 & 결과 수 */}
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <h1 className="text-4xl font-black tracking-tight text-text-accent-light dark:text-text-accent-dark">
                {currentCategoryName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalCount > 0 
                  ? `${currentPage * 12 + 1}-${Math.min((currentPage + 1) * 12, totalCount)} of ${totalCount} results`
                  : '결과 없음'
                }
              </p>
            </div>

            {/* 정렬 버튼 */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => handleSortChange('skuId', 'desc')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
                  isActiveSort('skuId', 'desc')
                    ? 'bg-primary text-white'
                    : 'bg-secondary-light dark:bg-secondary-dark hover:bg-primary/20'
                }`}
              >
                <p className="text-sm font-medium">기본순</p>
              </button>
              <button
                onClick={() => handleSortChange('createdAt', 'desc')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
                  isActiveSort('createdAt', 'desc')
                    ? 'bg-primary text-white'
                    : 'bg-secondary-light dark:bg-secondary-dark hover:bg-primary/20'
                }`}
              >
                <p className="text-sm font-medium">신상품순</p>
              </button>
              <button
                onClick={() => handleSortChange('price', 'asc')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
                  isActiveSort('price', 'asc')
                    ? 'bg-primary text-white'
                    : 'bg-secondary-light dark:bg-secondary-dark hover:bg-primary/20'
                }`}
              >
                <p className="text-sm font-medium">가격 낮은순</p>
              </button>
              <button
                onClick={() => handleSortChange('price', 'desc')}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 ${
                  isActiveSort('price', 'desc')
                    ? 'bg-primary text-white'
                    : 'bg-secondary-light dark:bg-secondary-dark hover:bg-primary/20'
                }`}
              >
                <p className="text-sm font-medium">가격 높은순</p>
              </button>
            </div>

            {/* 상품 목록 */}
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                  inventory_2
                </span>
                <p className="text-lg text-gray-500 mb-4">검색 결과가 없습니다</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={`${product.id}-${product.skuId}`}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-12">
                {/* 이전 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    currentPage === 0
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-secondary-light dark:bg-secondary-dark text-gray-500 hover:bg-primary/20 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => handlePageChange(pageNum)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary/20 hover:text-primary'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                {/* 다음 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data?.hasNext}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    !data?.hasNext
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-secondary-light dark:bg-secondary-dark text-gray-500 hover:bg-primary/20 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

