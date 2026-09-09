import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, deleteProduct } from '../api/products.api';
import type { ProductSearchParams, ProductStatus } from '../types/api.types';
import { useAuthStore } from '../store/authStore';
import AdminSidebar from '../components/layout/AdminSidebar';

export default function AdminProductList() {
  const queryClient = useQueryClient();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL');

  // 검색 파라미터
  const searchParams: ProductSearchParams = {
    page: 0,
    size: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(searchKeyword && { keyword: searchKeyword }),
    ...(statusFilter !== 'ALL' && { status: statusFilter }),
  };

  // 상품 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-products', searchParams],
    queryFn: () => getProducts(searchParams),
  });

  // 디버깅: API 응답 확인
  console.log('상품 목록 API 응답:', { data, isLoading, error });
  console.log('검색 파라미터:', searchParams);

  // 상품 삭제 mutation
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      alert('상품이 삭제되었습니다.');
    },
    onError: (error: any) => {
      alert(`상품 삭제 실패: ${error.response?.data?.message || error.message}`);
    },
  });

  // 삭제 확인
  const handleDelete = (productId: number) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  // 상태 필터 버튼 클릭
  const handleStatusFilter = (status: ProductStatus | 'ALL') => {
    setStatusFilter(status);
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 상태 배지 스타일
  const getStatusBadge = (status: ProductStatus) => {
    const statusMap = {
      ACTIVE: {
        label: '판매중',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      },
      SOLD_OUT: {
        label: '품절',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      },
      INACTIVE: {
        label: '비활성',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      },
      HIDDEN: {
        label: '숨김',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
      },
      DELETED: {
        label: '삭제됨',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      },
    };
    return statusMap[status] || statusMap.HIDDEN;
  };

  const { user } = useAuthStore();

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main dark:text-white h-screen overflow-hidden flex">
      {/* 사이드바 */}
      <AdminSidebar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* 헤더 */}
        <header className="flex-none h-16 bg-surface-light dark:bg-surface-dark border-b border-[#e5e7eb] dark:border-gray-700 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-text-main dark:text-white">상품 목록</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center w-64 h-10 rounded-lg bg-background-light dark:bg-gray-800 px-3 border border-transparent focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-text-secondary">search</span>
              <input
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-text-main dark:text-white placeholder:text-text-secondary focus:ring-0"
                placeholder="검색..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-text-main dark:text-white transition-colors relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
              </button>
              <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div
                  className="size-8 rounded-full bg-cover bg-center border border-gray-200 bg-primary/20 flex items-center justify-center"
                >
                  <div className="w-full h-full flex items-center justify-center text-text-main font-bold text-xs">
                    {user?.name?.charAt(0) || '관'}
                  </div>
                </div>
                <span className="text-sm font-semibold text-text-main dark:text-white hidden lg:block">
                  {user?.name || '관리자'}님
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-8 bg-background-light dark:bg-background-dark">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="mb-4">
              <p className="text-text-secondary dark:text-gray-400 text-sm">
                등록된 상품을 조회하고 재고 및 상태를 관리합니다.
              </p>
            </div>
            <div className="flex justify-end">
              <Link
                to="/products/new"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>상품 등록</span>
              </Link>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-[#dbe6e3] dark:border-[#2a3c38] flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              {/* Search */}
              <div className="relative w-full lg:w-96 group">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="상품명으로 검색하세요"
                  className="w-full h-11 pl-11 pr-4 rounded-lg bg-background-light dark:bg-background-dark border-[#dbe6e3] dark:border-[#2a3c38] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-text-main dark:text-white placeholder:text-text-sub"
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub group-focus-within:text-primary transition-colors">search</span>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <span className="text-xs font-semibold text-text-sub dark:text-gray-500 uppercase mr-1">상태 필터:</span>
                <button
                  onClick={() => handleStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-primary text-primary-content border-transparent shadow-sm'
                      : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-[#2a3c38] hover:border-primary dark:hover:border-primary'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => handleStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-primary text-primary-content border-transparent shadow-sm'
                      : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-[#2a3c38] hover:border-primary dark:hover:border-primary'
                  }`}
                >
                  판매중
                </button>
                <button
                  onClick={() => handleStatusFilter('SOLD_OUT')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === 'SOLD_OUT'
                      ? 'bg-primary text-primary-content border-transparent shadow-sm'
                      : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-[#2a3c38] hover:border-primary dark:hover:border-primary'
                  }`}
                >
                  품절
                </button>
                <button
                  onClick={() => handleStatusFilter('HIDDEN')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === 'HIDDEN'
                      ? 'bg-primary text-primary-content border-transparent shadow-sm'
                      : 'bg-white dark:bg-background-dark text-text-sub border-[#dbe6e3] dark:border-[#2a3c38] hover:border-primary dark:hover:border-primary'
                  }`}
                >
                  숨김
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-[#dbe6e3] dark:border-[#2a3c38] overflow-hidden">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-8 text-center text-text-sub">로딩 중...</div>
                ) : error ? (
                  <div className="p-8 text-center text-red-600">
                    <p>상품 목록을 불러올 수 없습니다.</p>
                    <p className="text-xs mt-2 text-gray-500">{String(error)}</p>
                  </div>
                ) : !data?.items || data.items.length === 0 ? (
                  <div className="p-8 text-center text-text-sub">
                    등록된 상품이 없습니다.
                    {data && <p className="text-xs mt-2">응답 데이터: {JSON.stringify(data)}</p>}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-background-light dark:bg-background-dark border-b border-[#dbe6e3] dark:border-[#2a3c38]">
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-16">번호</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider min-w-[240px]">상품명</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-32">가격</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-24">재고</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-32 text-center">상태</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-32">등록일</th>
                        <th className="py-4 px-6 text-xs font-bold text-text-sub dark:text-gray-400 uppercase tracking-wider w-28 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe6e3] dark:divide-[#2a3c38]">
                      {data.items.map((item, index) => {
                        const statusBadge = getStatusBadge(item.status || 'HIDDEN');
                        return (
                          <tr key={item.id} className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors">
                            <td className="py-4 px-6 text-sm text-text-sub dark:text-gray-400 font-medium">{index + 1}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {item.imageUrl && (
                                  <div
                                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 bg-cover bg-center border border-[#dbe6e3] dark:border-[#2a3c38]"
                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-text-main dark:text-gray-200 group-hover:text-primary transition-colors">
                                    {item.name}
                                  </span>
                                  {item.optionName && (
                                    <span className="text-xs text-text-sub dark:text-gray-500">{item.optionName}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm font-semibold text-text-main dark:text-gray-200">
                              {item.price?.toLocaleString() || 0}원
                            </td>
                            <td className="py-4 px-6 text-sm text-text-sub dark:text-gray-400">
                              {item.totalStock !== undefined ? `${item.totalStock}개` : '-'}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-text-sub dark:text-gray-400">
                              {item.createdAt ? formatDate(item.createdAt) : '-'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/admin/products/${item.id}/edit`}
                                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-sub hover:text-primary transition-colors"
                                  title="수정"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </Link>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  disabled={deleteProductMutation.isPending}
                                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-sub hover:text-red-500 transition-colors disabled:opacity-50"
                                  title="삭제"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

