import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getWishlists, deleteWishlist, addToCart } from '../api/products.api';
import type { ProductStatus } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import placeholderImg from '../assets/image-placeholder.svg';

type SortOption = 'latest' | 'priceAsc' | 'priceDesc' | 'nameAsc';

export default function Wishlist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
  const [selectedItems, setSelectedItems] = useState<number[]>([]); // wishlistId 배열
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 위시리스트 조회
  // 개발 환경에서는 user?.id가 없어도 Mock 데이터 사용 가능
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wishlists', user?.id || 'mock', currentPage, pageSize],
    queryFn: () => getWishlists(user?.id || 1, { page: currentPage, size: pageSize }),
    enabled: true, // 개발 환경에서도 항상 활성화
  });

  // 정렬 및 필터링된 목록
  const filteredAndSortedItems = useMemo(() => {
    if (!data?.content) return [];
    
    let items = [...data.content];
    
    // 품절 상품 숨기기
    if (hideSoldOut) {
      items = items.filter(item => item.productStatus !== 'SOLD_OUT');
    }
    
    // 정렬
    switch (sortOption) {
      case 'latest':
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'priceAsc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        items.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
    }
    
    return items;
  }, [data?.content, hideSoldOut, sortOption]);

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredAndSortedItems.map(item => item.wishlistId));
    } else {
      setSelectedItems([]);
    }
  };

  // 개별 선택/해제
  const handleSelectItem = (wishlistId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, wishlistId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== wishlistId));
    }
  };

  // 선택 삭제
  const deleteSelectedMutation = useMutation({
    mutationFn: async (wishlistIds: number[]) => {
      await Promise.all(wishlistIds.map(id => deleteWishlist(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      setSelectedItems([]);
      alert('선택한 상품이 삭제되었습니다.');
    },
    onError: () => {
      alert('삭제에 실패했습니다.');
    },
  });

  // 개별 삭제
  const deleteItemMutation = useMutation({
    mutationFn: deleteWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] });
      alert('찜 목록에서 삭제되었습니다.');
    },
    onError: () => {
      alert('삭제에 실패했습니다.');
    },
  });

  // 장바구니 추가
  const addToCartMutation = useMutation({
    mutationFn: (skuId: number) => addToCart({ skuId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const goToCart = window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?');
      if (goToCart) {
        navigate('/cart');
      }
    },
    onError: () => {
      alert('장바구니 추가에 실패했습니다.');
    },
  });

  // 상태 배지
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { text: '판매중', className: 'bg-green-50 text-green-700 ring-green-600/20' };
      case 'SOLD_OUT':
        return { text: '품절', className: 'bg-gray-600 text-white ring-gray-600/20' };
      case 'HIDDEN':
        return { text: '숨김', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' };
      case 'DELETED':
        return { text: '삭제됨', className: 'bg-red-50 text-red-600 ring-red-600/20' };
      default:
        return { text: '알 수 없음', className: 'bg-gray-50 text-gray-600 ring-gray-500/20' };
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const isAllSelected = filteredAndSortedItems.length > 0 && selectedItems.length === filteredAndSortedItems.length;

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="aspect-square w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="mt-4 flex justify-between items-end">
                      <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
              <span className="material-symbols-outlined text-4xl text-danger mb-4">error</span>
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark">데이터를 불러오지 못했습니다.</h3>
              <p className="mt-1 text-sm text-subtext-light dark:text-subtext-dark mb-6">일시적인 오류입니다. 잠시 후 다시 시도해주세요.</p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                재시도
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEmpty = !data?.content || data.content.length === 0;
  const displayItems = filteredAndSortedItems;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* 헤더 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black tracking-tight">찜한 상품</h2>
            <p className="text-subtext-light dark:text-subtext-dark">나중에 구매하려고 찜해둔 상품 목록입니다.</p>
          </div>

          {/* 필터 및 정렬 */}
          {!isEmpty && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-primary border-gray-300 focus:ring-primary h-5 w-5"
                  />
                  <span className="text-sm font-medium text-text-light dark:text-text-dark group-hover:text-primary transition-colors">
                    전체 선택 ({selectedItems.length})
                  </span>
                </label>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      alert('삭제할 상품을 선택해주세요.');
                      return;
                    }
                    if (window.confirm(`선택한 ${selectedItems.length}개의 상품을 삭제하시겠습니까?`)) {
                      deleteSelectedMutation.mutate(selectedItems);
                    }
                  }}
                  disabled={deleteSelectedMutation.isPending || selectedItems.length === 0}
                  className="text-sm font-medium text-subtext-light hover:text-danger dark:hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  선택 삭제
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-subtext-light hover:text-text-light dark:hover:text-text-dark transition-colors">
                  <input
                    type="checkbox"
                    checked={hideSoldOut}
                    onChange={(e) => setHideSoldOut(e.target.checked)}
                    className="rounded text-primary border-gray-300 focus:ring-primary h-4 w-4"
                  />
                  <span>품절 상품 숨기기</span>
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:border-primary focus:ring-primary py-2 pl-3 pr-8 cursor-pointer"
                >
                  <option value="latest">최신순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="nameAsc">상품명순</option>
                </select>
              </div>
            </div>
          )}

          {/* 상품 목록 */}
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-dashed">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
                <span className="material-symbols-outlined text-4xl text-primary">favorite_border</span>
              </div>
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark">찜한 상품이 없습니다.</h3>
              <p className="mt-2 text-subtext-light dark:text-subtext-dark max-w-sm">
                마음에 드는 상품을 찾아 위시리스트에 담아보세요.<br />쇼핑을 시작하시겠습니까?
              </p>
              <Link
                to="/products"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
              >
                쇼핑하러 가기
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-text-light dark:text-text-dark">표시할 상품이 없습니다.</h3>
              <p className="mt-2 text-subtext-light dark:text-subtext-dark">필터 조건을 변경해보세요.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayItems.map((item) => {
                  const statusBadge = getStatusBadge(item.productStatus);
                  const isSoldOut = item.productStatus === 'SOLD_OUT';
                  const isSelected = selectedItems.includes(item.wishlistId);
                  
                  return (
                    <div
                      key={item.wishlistId}
                      className={`group flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                        isSoldOut ? 'opacity-75 grayscale hover:grayscale-0 hover:opacity-100' : ''
                      }`}
                    >
                      {/* 이미지 */}
                      <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Link to={`/products/${item.productId}`}>
                          <img
                            alt={item.productName}
                            src={item.productImageUrl || placeholderImg}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = placeholderImg;
                            }}
                          />
                        </Link>
                        {isSoldOut && <div className="absolute inset-0 bg-black/10" />}
                        <div className="absolute top-3 left-3 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectItem(item.wishlistId, e.target.checked)}
                            className="rounded-md text-primary border-white bg-white/80 h-5 w-5 shadow-sm cursor-pointer hover:bg-white focus:ring-primary focus:ring-offset-0"
                          />
                        </div>
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset backdrop-blur-md ${statusBadge.className}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex flex-1 flex-col p-5">
                        {/* 카테고리 */}
                        {item.categoryName && (
                          <div className="mb-2 flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark">
                            <span>{item.categoryName}</span>
                          </div>
                        )}
                        
                        {/* 상품명 */}
                        <Link to={`/products/${item.productId}`}>
                          <h3 className="text-base font-bold text-text-light dark:text-text-dark cursor-pointer hover:text-primary transition-colors line-clamp-2">
                            {item.productName}
                          </h3>
                        </Link>
                        
                        {/* 설명 */}
                        {item.productDescription && (
                          <p className="mt-1 text-sm text-subtext-light dark:text-subtext-dark line-clamp-1">
                            {item.productDescription}
                          </p>
                        )}
                        
                        {/* 옵션 */}
                        {Object.keys(item.options).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(item.options).map(([key, value]) => (
                              <span
                                key={`${key}-${value}`}
                                className="inline-flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10"
                              >
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* 가격 및 찜한 날짜 */}
                        <div className="mt-auto pt-4 flex items-end justify-between">
                          <div>
                            <p className="text-lg font-bold text-text-light dark:text-text-dark">
                              {item.price.toLocaleString()}
                              <span className="text-sm font-normal ml-0.5">원</span>
                            </p>
                            <p className="text-xs text-subtext-light mt-1">{formatDate(item.createdAt)} 찜함</p>
                          </div>
                        </div>
                        
                        {/* 버튼 */}
                        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => addToCartMutation.mutate(item.skuId)}
                            disabled={isSoldOut || addToCartMutation.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-3 text-sm font-bold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {isSoldOut ? (
                              <>
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                품절
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                담기
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('찜 목록에서 삭제하시겠습니까?')) {
                                deleteItemMutation.mutate(item.wishlistId);
                              }
                            }}
                            disabled={deleteItemMutation.isPending}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 text-subtext-light hover:bg-red-50 hover:text-danger hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 페이징 */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-subtext-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {[...Array(data.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium transition-colors ${
                        i === currentPage
                          ? 'bg-primary text-white border-primary'
                          : 'text-subtext-light hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(data.totalPages - 1, prev + 1))}
                    disabled={currentPage >= data.totalPages - 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-subtext-light hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

