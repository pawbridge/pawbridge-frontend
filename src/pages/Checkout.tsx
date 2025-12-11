import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createOrder, createDirectOrder } from '../api/products.api';
import type { CartItem, CreateOrderRequest, DirectOrderRequest } from '../types/api.types';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

// 다음 우편번호 API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: DaumPostcodeData) => void;
      }) => { open: () => void };
    };
  }
}

interface DaumPostcodeData {
  address: string;      // 기본 주소
  addressType: string;  // 주소 타입 (R: 도로명, J: 지번)
  roadAddress: string;  // 도로명 주소
  jibunAddress: string; // 지번 주소
  zonecode: string;     // 우편번호
  buildingName: string; // 건물명
}

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

// 장바구니에서 온 경우
interface CartCheckoutState {
  cartItems: CartItem[];
  totalProductPrice: number;
  shippingFee: number;
  totalPrice: number;
}

// 바로 구매에서 온 경우
interface DirectOrderProduct {
  productId: number;
  name: string;
  imageUrl: string;
  skuCode: string;
  price: number;
  options: Record<string, string>;
}

interface DirectCheckoutState {
  directOrder: {
    skuId: number;
    quantity: number;
    product: DirectOrderProduct;
  };
}

type CheckoutState = CartCheckoutState | DirectCheckoutState;

// 타입 가드
function isDirectCheckout(state: CheckoutState): state is DirectCheckoutState {
  return 'directOrder' in state;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CheckoutState | null;

  // 바로 구매 모드인지 확인
  const isDirectOrder = state && isDirectCheckout(state);

  // 폼 상태
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
    deliveryAddressDetail: '',
    deliveryMessage: '',
  });

  // 결제 취소/오류 모달
  const [paymentModal, setPaymentModal] = useState<{ type: 'cancel' | 'error'; message: string } | null>(null);

  // 유효성 검사 에러
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 금액 계산
  const calculatePrices = () => {
    if (isDirectOrder) {
      const { product, quantity } = state.directOrder;
      const totalProductPrice = product.price * quantity;
      const shippingFee = totalProductPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      return {
        totalProductPrice,
        shippingFee,
        totalPrice: totalProductPrice + shippingFee,
      };
    } else if (state && 'cartItems' in state) {
      return {
        totalProductPrice: state.totalProductPrice,
        shippingFee: state.shippingFee,
        totalPrice: state.totalPrice,
      };
    }
    return { totalProductPrice: 0, shippingFee: 0, totalPrice: 0 };
  };

  const prices = calculatePrices();

  // 데이터가 없으면 리다이렉트
  useEffect(() => {
    if (!state) {
      alert('잘못된 접근입니다.');
      navigate('/products');
      return;
    }
    
    if (!isDirectOrder) {
      const cartState = state as CartCheckoutState;
      if (!cartState.cartItems || cartState.cartItems.length === 0) {
        alert('장바구니가 비어있습니다.');
        navigate('/cart');
      }
    }
  }, [state, navigate, isDirectOrder]);

  // 장바구니 주문 생성 mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) => createOrder(orderData),
    onSuccess: (data) => {
      requestTossPayment(data.orderId, data.orderUuid, data.totalAmount);
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
      alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  // 바로 구매 주문 생성 mutation
  const createDirectOrderMutation = useMutation({
    mutationFn: (orderData: DirectOrderRequest) => createDirectOrder(orderData),
    onSuccess: (data) => {
      requestTossPayment(data.orderId, data.orderUuid, data.totalAmount);
    },
    onError: (error) => {
      console.error('Direct order creation failed:', error);
      alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
    },
  });

  // 토스페이먼츠 결제 요청
  const requestTossPayment = async (orderId: number, orderUuid: string, amount: number) => {
    const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
    
    // 디버깅: 환경 변수 확인
    console.log('=== 토스페이먼츠 환경 변수 확인 ===');
    console.log('VITE_TOSS_CLIENT_KEY:', clientKey);
    console.log('clientKey 존재 여부:', !!clientKey);
    
    if (!clientKey) {
      alert('결제 설정이 올바르지 않습니다. 관리자에게 문의해주세요.');
      return;
    }

    // 주문명 생성
    let orderName = '';
    if (isDirectOrder) {
      orderName = state.directOrder.product.name;
    } else if (state && 'cartItems' in state) {
      const cartState = state as CartCheckoutState;
      orderName = cartState.cartItems.length === 1
        ? cartState.cartItems[0].productName
        : `${cartState.cartItems[0].productName} 외 ${cartState.cartItems.length - 1}건`;
    }

    try {
      const { loadTossPayments } = await import('@tosspayments/payment-sdk');
      const tossPayments = await loadTossPayments(clientKey);

      await tossPayments.requestPayment('카드', {
        amount,
        orderId: orderUuid,
        orderName,
        customerName: formData.receiverName,
        successUrl: `${window.location.origin}/order-complete?internalOrderId=${orderId}`,
        failUrl: `${window.location.origin}/checkout?error=payment_failed`,
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        setPaymentModal({ type: 'cancel', message: '결제가 취소되었습니다.' });
      } else {
        console.error('Payment error:', error);
        setPaymentModal({ type: 'error', message: '결제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' });
      }
    }
  };

  // 입력 값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, receiverPhone: formatted }));
    
    if (errors.receiverPhone) {
      setErrors(prev => ({ ...prev, receiverPhone: '' }));
    }
  };

  // 다음 우편번호 검색
  const handleAddressSearch = () => {
    // 스크립트 로드 확인
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data: DaumPostcodeData) => {
        console.log('다음 우편번호 응답:', data); // 디버깅용
        
        // 도로명 주소 우선, 없으면 지번 주소 사용
        const address = data.roadAddress || data.jibunAddress;
        console.log('선택된 주소:', address); // 디버깅용
        
        // 건물명이 있으면 추가
        const fullAddress = data.buildingName 
          ? `${address} (${data.buildingName})`
          : address;
        
        console.log('최종 주소:', fullAddress); // 디버깅용
        
        setFormData(prev => {
          const newData = {
            ...prev,
            deliveryAddress: fullAddress,
            deliveryAddressDetail: '', // 상세주소 초기화
          };
          console.log('업데이트된 formData:', newData); // 디버깅용
          return newData;
        });
        
        // 에러 초기화
        if (errors.deliveryAddress) {
          setErrors(prev => ({ ...prev, deliveryAddress: '' }));
        }
      },
    }).open();
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.receiverName.trim()) {
      newErrors.receiverName = '받는 사람 이름을 입력해주세요.';
    }

    if (!formData.receiverPhone.trim()) {
      newErrors.receiverPhone = '연락처를 입력해주세요.';
    } else if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(formData.receiverPhone)) {
      newErrors.receiverPhone = '올바른 전화번호 형식이 아닙니다.';
    }

    if (!formData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = '배송 주소를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 결제하기 버튼 클릭
  const handleSubmit = () => {
    if (!validateForm()) return;

    const fullAddress = formData.deliveryAddressDetail
      ? `${formData.deliveryAddress} ${formData.deliveryAddressDetail}`
      : formData.deliveryAddress;

    if (isDirectOrder) {
      // 바로 구매
      createDirectOrderMutation.mutate({
        skuId: state.directOrder.skuId,
        quantity: state.directOrder.quantity,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone.replace(/-/g, ''),
        deliveryAddress: fullAddress,
        deliveryMessage: formData.deliveryMessage || undefined,
      });
    } else {
      // 장바구니 구매
      createOrderMutation.mutate({
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone.replace(/-/g, ''),
        deliveryAddress: fullAddress,
        deliveryMessage: formData.deliveryMessage || undefined,
      });
    }
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 옵션 텍스트 생성
  const getOptionText = (options: Record<string, string>) => {
    return Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(', ');
  };

  const isPending = createOrderMutation.isPending || createDirectOrderMutation.isPending;

  if (!state) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 text-center">
            <span className="material-symbols-outlined text-4xl text-primary mx-auto">
              {paymentModal.type === 'cancel' ? 'info' : 'error'}
            </span>
            <p className="text-lg font-bold text-text-light dark:text-text-dark">
              {paymentModal.type === 'cancel' ? '결제가 취소되었습니다' : '결제 오류'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {paymentModal.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setPaymentModal(null)}
                className="w-full inline-flex justify-center items-center rounded-lg h-11 bg-primary text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl flex flex-col gap-8">
          {/* 페이지 제목 */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-text-light dark:text-text-dark min-w-72">
              주문서 작성
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 flex flex-col gap-8">
              {/* 주문 상품 섹션 */}
              <section className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
                  주문 상품
                </h2>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div className="flex flex-col gap-4">
                  {isDirectOrder ? (
                    // 바로 구매 상품
                    <div className="flex items-center gap-4 py-2 justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16 bg-gray-100"
                          style={{ backgroundImage: state.directOrder.product.imageUrl ? `url('${state.directOrder.product.imageUrl}')` : undefined }}
                        >
                          {!state.directOrder.product.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl text-gray-400">image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                            {state.directOrder.product.name}
                          </p>
                          <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400">
                            {getOptionText(state.directOrder.product.options)} / 수량: {state.directOrder.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <p className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                          {formatPrice(state.directOrder.product.price * state.directOrder.quantity)}원
                        </p>
                      </div>
                    </div>
                  ) : (
                    // 장바구니 상품
                    (state as CartCheckoutState).cartItems.map((item) => (
                      <div key={item.skuId} className="flex items-center gap-4 py-2 justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16 bg-gray-100"
                            style={{ backgroundImage: item.imageUrl ? `url('${item.imageUrl}')` : undefined }}
                          >
                            {!item.imageUrl && (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-gray-400">image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                              {item.productName}
                            </p>
                            <p className="text-sm font-normal leading-normal text-gray-500 dark:text-gray-400">
                              {item.skuCode} / 수량: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <p className="text-base font-medium leading-normal text-text-light dark:text-text-dark">
                            {formatPrice(item.price * item.quantity)}원
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* 배송 정보 섹션 */}
              <section className="flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
                  배송 정보
                </h2>
                <div className="flex flex-col gap-4">
                  {/* 받는 사람 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      받는 사람 이름 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="receiverName"
                      value={formData.receiverName}
                      onChange={handleInputChange}
                      placeholder="이름을 입력하세요"
                      className={`block w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:outline-none ${
                        errors.receiverName 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                      }`}
                    />
                    {errors.receiverName && (
                      <p className="mt-1 text-xs text-red-500">{errors.receiverName}</p>
                    )}
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="receiverPhone"
                      value={formData.receiverPhone}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                      className={`block w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:outline-none ${
                        errors.receiverPhone 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                      }`}
                    />
                    {errors.receiverPhone && (
                      <p className="mt-1 text-xs text-red-500">{errors.receiverPhone}</p>
                    )}
                  </div>

                  {/* 배송 주소 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      배송 주소 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        readOnly
                        onClick={handleAddressSearch}
                        placeholder="주소 찾기를 클릭하세요"
                        className={`block w-full px-4 py-3 rounded-lg border bg-gray-100 dark:bg-gray-900 cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none ${
                          errors.deliveryAddress 
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleAddressSearch}
                        className="flex-shrink-0 px-4 py-3 text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        주소 찾기
                      </button>
                    </div>
                    <input
                      type="text"
                      name="deliveryAddressDetail"
                      value={formData.deliveryAddressDetail}
                      onChange={handleInputChange}
                      placeholder="상세주소를 입력하세요"
                      className="mt-2 block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                    />
                    {errors.deliveryAddress && (
                      <p className="mt-1 text-xs text-red-500">{errors.deliveryAddress}</p>
                    )}
                  </div>

                  {/* 배송 메모 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      배송 메모
                    </label>
                    <textarea
                      name="deliveryMessage"
                      value={formData.deliveryMessage}
                      onChange={handleInputChange}
                      placeholder="예: 문 앞에 놔주세요"
                      rows={3}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* 최종 결제 금액 섹션 */}
            <div className="md:col-span-1">
              <div className="sticky top-10 flex flex-col gap-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] text-text-light dark:text-text-dark">
                  최종 결제 금액
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">상품 금액</p>
                    <p className="text-text-light dark:text-text-dark">
                      {formatPrice(prices.totalProductPrice)}원
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-600 dark:text-gray-400">배송비</p>
                    <p className="text-text-light dark:text-text-dark">
                      {prices.shippingFee === 0 ? '무료' : `${formatPrice(prices.shippingFee)}원`}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div className="flex justify-between items-center">
                  <p className="text-base font-bold text-text-light dark:text-text-dark">총 결제 금액</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(prices.totalPrice)}원</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-gray-900 text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? '처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
