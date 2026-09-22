import MyPageListState, { type MyPageListFeedback } from './MyPageListState';
import { Link } from 'react-router-dom';
import type { CartItem } from '../../types/api.types';
import { formatPrice } from './marketPresentation';

interface MyCartPanelProps {
  feedback: MyPageListFeedback;
  cartItems: CartItem[];
  totalProductPrice: number;
  shippingFee: number;
  totalPrice: number;
  freeShippingThreshold: number;
  onClearCart: () => void;
  onOrder: () => void;
  isClearingCart: boolean;
}

export default function MyCartPanel({
  feedback,
  cartItems,
  totalProductPrice,
  shippingFee,
  totalPrice,
  freeShippingThreshold,
  onClearCart,
  onOrder,
  isClearingCart,
}: MyCartPanelProps) {
  return (
    <>
      <div className="flex justify-between items-center pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
          나의 장바구니
        </h2>
        {!feedback.isError && cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
            disabled={isClearingCart}
          >
            장바구니 비우기
          </button>
        )}
      </div>

      <MyPageListState label="장바구니를" {...feedback}>
        {cartItems.length === 0 ? (
          <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">shopping_cart_off</span>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">장바구니가 비어있습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">마음에 드는 상품을 담아보세요.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-bold text-brand-ink shadow-lg shadow-brand/20 hover:bg-brand-hover transition-all"
            >
              쇼핑 계속하기
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* 상품 목록 */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.skuId}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* 상품 이미지 */}
                  <div
                    className="w-20 h-20 rounded-md bg-cover bg-center flex-shrink-0 bg-gray-100"
                    style={{ backgroundImage: item.productImageUrl ? `url('${item.productImageUrl}')` : undefined }}
                  >
                    {!item.productImageUrl && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-gray-400">image</span>
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-light dark:text-text-dark truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.skuCode}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">단가: ₩{formatPrice(item.price)}</span>
                      <span className="text-gray-500 dark:text-gray-400">수량: {item.quantity}</span>
                    </div>
                  </div>

                  {/* 소계 */}
                  <div className="text-right">
                    <p className="font-bold text-text-light dark:text-text-dark">
                      ₩{formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 주문 요약 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-4">주문 요약</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">총 상품 금액</p>
                  <p className="text-text-light dark:text-text-dark text-sm">₩{formatPrice(totalProductPrice)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">배송비</p>
                  <p className="text-text-light dark:text-text-dark text-sm">
                    {shippingFee === 0 ? '무료' : `₩${formatPrice(shippingFee)}`}
                  </p>
                </div>
                {totalProductPrice < freeShippingThreshold && (
                  <p className="text-xs text-brand-accent">
                    ₩{formatPrice(freeShippingThreshold - totalProductPrice)} 더 구매 시 무료배송!
                  </p>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
                <div className="flex justify-between items-center">
                  <p className="text-text-light dark:text-text-dark text-base font-bold">총 결제 예정 금액</p>
                  <p className="text-brand-accent text-xl font-bold">₩{formatPrice(totalPrice)}</p>
                </div>
              </div>
              <button
                onClick={onOrder}
                className="w-full mt-6 flex items-center justify-center rounded-lg h-12 bg-brand text-brand-ink text-base font-bold hover:bg-brand-hover transition-colors"
              >
                주문하기
              </button>
            </div>
          </div>
        )}
      </MyPageListState>
    </>
  );
}
