import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, clearCart } from '../api/products.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 총 상품 금액
  const totalProductPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 배송비 (50,000원 이상 무료)
  const shippingFee = totalProductPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  // 총 결제 금액
  const totalPrice = totalProductPrice + shippingFee;

  // 장바구니 비우기
  const handleClearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      clearCartMutation.mutate();
    }
  };

  // 주문하기
  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    // 주문 페이지로 이동 (장바구니 데이터와 함께)
    navigate('/checkout', { 
      state: { 
        cartItems, 
        totalProductPrice, 
        shippingFee, 
        totalPrice 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">장바구니를 불러오는 중...</p>
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
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500 mb-4">장바구니를 불러오는데 실패했습니다.</p>
            <p className="text-gray-400 text-sm mb-4">로그인이 필요합니다.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              로그인하기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 장바구니가 비어있을 때
  if (cartItems.length === 0) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 xl:px-40 py-8 md:py-12">
          <div className="mx-auto max-w-[1200px]">
            <h1 className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em] mb-8">
              장바구니
            </h1>
            <div className="flex flex-col items-center justify-center text-center gap-8 py-16 px-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-6xl text-primary">shopping_cart_off</span>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">장바구니가 비어있습니다.</h2>
                <p className="text-gray-500 dark:text-gray-400">마음에 드는 상품을 담아보세요.</p>
              </div>
              <Link
                to="/products"
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 md:px-10 lg:px-20 xl:px-40 py-8 md:py-12">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 md:gap-12">
          {/* 헤더 */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
              장바구니
            </h1>
            <button
              onClick={handleClearCart}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
              disabled={clearCartMutation.isPending}
            >
              장바구니 비우기
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 상품 목록 */}
            <div className="lg:col-span-2">
              <div className="flex flex-col">
                {/* 테이블 헤더 */}
                <div className="hidden md:grid grid-cols-5 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">
                  <span className="col-span-2 text-left">상품 정보</span>
                  <span>단가</span>
                  <span>수량</span>
                  <span>소계</span>
                </div>

                {/* 상품 아이템 */}
                <div className="flex flex-col gap-6 pt-6">
                  {cartItems.map((item) => (
                    <div
                      key={item.skuId}
                      className="grid grid-cols-1 md:grid-cols-5 md:items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                    >
                      {/* 상품 정보 */}
                      <div className="md:col-span-2 flex items-center gap-4">
                        <div
                          className="w-20 h-20 rounded-md bg-cover bg-center flex-shrink-0 bg-gray-100"
                          style={{ backgroundImage: item.imageUrl ? `url('${item.imageUrl}')` : undefined }}
                        >
                          {!item.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-2xl text-gray-400">image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-text-light dark:text-text-dark">{item.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.skuCode}</p>
                        </div>
                      </div>

                      {/* 단가 */}
                      <div className="text-left md:text-center text-gray-500 dark:text-gray-400">
                        <span className="md:hidden font-medium text-text-light dark:text-text-dark">단가: </span>
                        ₩{formatPrice(item.price)}
                      </div>

                      {/* 수량 */}
                      <div className="text-left md:text-center text-gray-500 dark:text-gray-400">
                        <span className="md:hidden font-medium text-text-light dark:text-text-dark">수량: </span>
                        {item.quantity}
                      </div>

                      {/* 소계 */}
                      <div className="text-left md:text-center font-bold text-text-light dark:text-text-dark">
                        <span className="md:hidden font-medium">소계: </span>
                        ₩{formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  주문 요약
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between gap-x-6 py-2">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">총 상품 금액</p>
                    <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal text-right">
                      ₩{formatPrice(totalProductPrice)}
                    </p>
                  </div>
                  <div className="flex justify-between gap-x-6 py-2">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">배송비</p>
                    <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal text-right">
                      {shippingFee === 0 ? '무료' : `₩${formatPrice(shippingFee)}`}
                    </p>
                  </div>
                  {totalProductPrice < FREE_SHIPPING_THRESHOLD && (
                    <p className="text-xs text-primary">
                      ₩{formatPrice(FREE_SHIPPING_THRESHOLD - totalProductPrice)} 더 구매 시 무료배송!
                    </p>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                  <div className="flex justify-between gap-x-6 py-2">
                    <p className="text-text-light dark:text-text-dark text-base font-bold leading-normal">
                      총 결제 예정 금액
                    </p>
                    <p className="text-primary text-xl font-bold leading-normal text-right">
                      ₩{formatPrice(totalPrice)}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    onClick={handleOrder}
                    className="flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-colors"
                  >
                    주문하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

