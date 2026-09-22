import MyPageListState, { type MyPageListFeedback } from './MyPageListState';
import { Link } from 'react-router-dom';
import placeholderImg from '../../assets/image-placeholder.svg';
import type { WishlistItem, WishlistSearchResponse } from '../../types/api.types';
import { getStatusBadge } from './marketPresentation';

export type WishlistSortOption = 'latest' | 'priceAsc' | 'priceDesc' | 'nameAsc';
interface MyWishlistPanelProps {
  feedback: MyPageListFeedback;
  wishlists: WishlistSearchResponse | undefined;
  filteredAndSortedWishlist: WishlistItem[];
  selectedWishlistItems: number[];
  hideSoldOut: boolean;
  sortOption: WishlistSortOption;
  wishlistPage: number;
  onSelectAll: (checked: boolean) => void;
  onSelectItem: (id: number, checked: boolean) => void;
  onHideSoldOutChange: (hidden: boolean) => void;
  onSortChange: (sort: WishlistSortOption) => void;
  onPageChange: (page: number) => void;
  onDeleteSelected: () => void;
  onDeleteItem: (id: number) => void;
  onAddToCart: (skuId: number) => void;
  isDeletingSelected: boolean;
  isDeletingItem: boolean;
  isAddingToCart: boolean;
}

export default function MyWishlistPanel({
  feedback,
  wishlists,
  filteredAndSortedWishlist,
  selectedWishlistItems,
  hideSoldOut,
  sortOption,
  wishlistPage,
  onSelectAll,
  onSelectItem,
  onHideSoldOutChange,
  onSortChange,
  onPageChange,
  onDeleteSelected,
  onDeleteItem,
  onAddToCart,
  isDeletingSelected,
  isDeletingItem,
  isAddingToCart,
}: MyWishlistPanelProps) {
  return (
    <>
      <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
        나의 위시리스트
      </h2>

      <MyPageListState label="위시리스트를" {...feedback}>
        {wishlists && wishlists.content.length > 0 ? (
          <div className="mt-8 space-y-6">
            {/* 필터 및 정렬 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={filteredAndSortedWishlist.length > 0 && selectedWishlistItems.length === filteredAndSortedWishlist.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded text-brand-ink border-gray-300 focus:ring-brand-focus h-5 w-5"
                  />
                  <span className="text-sm font-medium text-text-light dark:text-text-dark group-hover:text-brand-accent transition-colors">
                    전체 선택 ({selectedWishlistItems.length})
                  </span>
                </label>
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <button
                  onClick={onDeleteSelected}
                  disabled={isDeletingSelected || selectedWishlistItems.length === 0}
                  className="text-sm font-medium text-subtext-light hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  선택 삭제
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-subtext-light hover:text-text-light dark:hover:text-text-dark transition-colors">
                  <input
                    type="checkbox"
                    checked={hideSoldOut}
                    onChange={(e) => onHideSoldOutChange(e.target.checked)}
                    className="rounded text-brand-ink border-gray-300 focus:ring-brand-focus h-4 w-4"
                  />
                  <span>품절 상품 숨기기</span>
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => onSortChange(e.target.value as WishlistSortOption)}
                  className="text-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:border-brand-focus focus:ring-brand-focus py-2 pl-3 pr-8 cursor-pointer"
                >
                  <option value="latest">최신순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="nameAsc">상품명순</option>
                </select>
              </div>
            </div>

            {/* 상품 목록 */}
            {filteredAndSortedWishlist.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">표시할 상품이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAndSortedWishlist.map((item) => {
                  const statusBadge = getStatusBadge(item.productStatus);
                  const isSoldOut = item.productStatus === 'SOLD_OUT';
                  const isSelected = selectedWishlistItems.includes(item.wishlistId);

                  return (
                    <div
                      key={item.wishlistId}
                      className={`group flex gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 p-4 ${
                        isSoldOut ? 'opacity-75' : ''
                      }`}
                    >
                      {/* 체크박스 + 이미지 */}
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectItem(item.wishlistId, e.target.checked)}
                          className="absolute top-2 left-2 z-10 rounded-md text-brand-ink border-white bg-white/80 h-5 w-5 shadow-sm cursor-pointer hover:bg-white focus:ring-brand-focus focus:ring-offset-0"
                        />
                        <Link to={`/products/${item.productId}`}>
                          <img
                            alt={item.productName}
                            src={item.productImageUrl || placeholderImg}
                            className="w-32 h-32 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = placeholderImg;
                            }}
                          />
                        </Link>
                        <span className={`absolute bottom-2 right-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset ${statusBadge.className}`}>
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          {item.categoryName && (
                            <p className="text-xs text-subtext-light dark:text-subtext-dark mb-1">
                              {item.categoryName}
                            </p>
                          )}
                          <Link to={`/products/${item.productId}`}>
                            <h3 className="text-base font-bold text-text-light dark:text-text-dark hover:text-brand-accent transition-colors line-clamp-2">
                              {item.productName}
                            </h3>
                          </Link>
                          {Object.keys(item.options).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(item.options).map(([key, value]) => (
                                <span
                                  key={`${key}-${value}`}
                                  className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                                >
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-lg font-bold text-text-light dark:text-text-dark mt-2">
                            {item.price.toLocaleString()}
                            <span className="text-sm font-normal ml-0.5">원</span>
                          </p>
                        </div>

                        {/* 버튼 */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => onAddToCart(item.skuId)}
                            disabled={isSoldOut || isAddingToCart}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-brand py-2 px-3 text-sm font-bold text-brand-ink hover:bg-brand-hover transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            {isSoldOut ? (
                              <>
                                <span className="material-symbols-outlined text-[16px]">block</span>
                                품절
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                                담기
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.wishlistId)}
                            disabled={isDeletingItem}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-subtext-light hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            title="삭제"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {wishlists && wishlists.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => onPageChange(Math.max(0, wishlistPage - 1))}
                  disabled={wishlistPage === 0}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  이전
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: wishlists.totalPages }, (_, i) => i).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        wishlistPage === page
                          ? 'bg-brand text-brand-ink'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onPageChange(Math.min(wishlists.totalPages - 1, wishlistPage + 1))}
                  disabled={wishlistPage >= wishlists.totalPages - 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">favorite_border</span>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">찜한 상품이 없습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">마음에 드는 상품을 찾아 위시리스트에 담아보세요.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-brand-ink shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all"
            >
              쇼핑하러 가기
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </MyPageListState>
    </>
  );
}
