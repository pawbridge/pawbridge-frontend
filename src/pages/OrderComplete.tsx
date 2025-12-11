import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOrderById, confirmPayment } from '../api/products.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function OrderComplete() {
  const [searchParams] = useSearchParams();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const pollDeadlineRef = useRef<number | null>(null); // 결제 승인 후 폴링 마감 시점
  const navigate = useNavigate();
  const hasCalledConfirm = useRef(false); // 중복 호출 방지
  
  // internalOrderId: 우리 시스템의 주문 ID (숫자)
  // orderId: 토스에서 전달하는 주문 UUID
  const internalOrderId = searchParams.get('internalOrderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  const orderUuid = searchParams.get('orderId'); // 토스에서 전달하는 UUID

  // 뒤로가기 방지 - 결제 완료 후 주문서 페이지로 돌아가지 않도록
  useEffect(() => {
    // 히스토리에 현재 페이지 추가 (뒤로가기 시 다시 이 페이지로)
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      // 뒤로가기 시 홈으로 이동
      navigate('/', { replace: true });
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // 주문 정보 조회
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', internalOrderId],
    queryFn: () => getOrderById(Number(internalOrderId)),
    enabled: !!internalOrderId && paymentConfirmed,
    // 결제 승인 후 PAID로 바뀔 때까지 1초 폴링, 최대 10초
    refetchInterval: (query) => {
      const latest = query.state.data;
      if (!paymentConfirmed) return false;
      if (latest?.status === 'PAID') return false;
      if (pollDeadlineRef.current && Date.now() > pollDeadlineRef.current) return false;
      return 1000; // 1초마다 재조회
    },
  });

  // 결제 승인 실패 상태
  const [paymentError, setPaymentError] = useState(false);

  // 토스페이먼츠 결제 승인 처리 - Payment Service (8084)
  // 이 API가 성공해야만 실제로 결제가 확정됨!
  const paymentMutation = useMutation({
    mutationFn: () => confirmPayment({
      paymentKey: paymentKey!,
      orderId: orderUuid!,
      amount: Number(amount),
    }),
    onSuccess: () => {
      pollDeadlineRef.current = Date.now() + 10_000; // 폴링 마감 시점(10초)
      setPaymentConfirmed(true);
      refetch();
    },
    onError: (error) => {
      console.error('Payment confirmation failed:', error);
      setPaymentError(true);  // 결제 실패 상태로 설정
    },
  });

  // 디버그: 상태 확인용 (임시)
  useEffect(() => {
    console.log('[OrderComplete] state', {
      paymentStatus: paymentMutation.status,
      paymentPending: paymentMutation.isPending,
      paymentConfirmed,
      paymentError,
      order,
      orderLoading: isLoading,
      orderError: error,
    });
  }, [paymentMutation.status, paymentMutation.isPending, paymentConfirmed, paymentError, order, isLoading, error]);

  // 결제 승인 처리 (중복 호출 방지)
  useEffect(() => {
    // 이미 호출했거나, 호출 중이면 스킵
    if (hasCalledConfirm.current || paymentMutation.isPending) {
      return;
    }

    if (paymentKey && orderUuid && amount && !paymentConfirmed) {
      // 토스페이먼츠에서 리다이렉트된 경우, 결제 승인 처리
      hasCalledConfirm.current = true; // 호출 플래그 설정
      paymentMutation.mutate();
    } else if (internalOrderId && !paymentKey) {
      // paymentKey 없이 internalOrderId만 있으면 이미 결제된 주문
      setPaymentConfirmed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentKey, orderUuid, amount, internalOrderId, paymentConfirmed]);

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (!internalOrderId) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500 mb-4">잘못된 접근입니다.</p>
            <Link
              to="/"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block"
            >
              홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 결제 승인 처리 중 로딩 (승인 성공/실패가 확정되면 지나감)
  if (paymentMutation.isPending && !paymentConfirmed && !paymentError) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">결제를 진행 중입니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 결제 승인 실패
  if (paymentError) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">payment</span>
            <h2 className="text-2xl font-bold text-red-500 mb-2">결제 승인 실패</h2>
            <p className="text-gray-500 mb-2">결제 처리 중 오류가 발생했습니다.</p>
            <p className="text-gray-400 text-sm mb-6">실제로 결제되지 않았으니 안심하세요.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/products"
                className="px-6 py-2 bg-primary text-gray-900 font-bold rounded-lg hover:bg-primary/90"
              >
                쇼핑 계속하기
              </Link>
              <Link
                to="/"
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                홈으로
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 결제 승인은 성공했으나 주문 상태가 PAID로 바뀌지 않은 채 폴링 타임아웃
  const pollExpired = paymentConfirmed
    && pollDeadlineRef.current !== null
    && Date.now() > pollDeadlineRef.current
    && order?.status !== 'PAID';

  if (pollExpired) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">hourglass_empty</span>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">결제 승인 처리 중</h2>
            <p className="text-gray-500 mb-2">결제 승인 상태를 확인하고 있습니다.</p>
            <p className="text-gray-400 text-sm mb-6">잠시 후 새로고침하거나, 처리 지연 시 문의해 주세요.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => refetch()}
                className="px-6 py-2 bg-primary text-gray-900 font-bold rounded-lg hover:bg-primary/90"
              >
                다시 시도
              </button>
              <Link
                to="/"
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                홈으로
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 결제는 승인되었으나 주문 상태가 아직 PAID가 아닐 때 (폴링 중)
  if (paymentConfirmed && order && order.status !== 'PAID') {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 mb-2">결제를 진행 중입니다.</p>
            <p className="text-gray-400 text-sm">잠시만 기다려 주세요.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">주문 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-4">error</span>
            <p className="text-gray-500 mb-4">주문 정보를 불러올 수 없습니다.</p>
            <Link
              to="/"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block"
            >
              홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 주문 상태가 PAID일 때만 결제 완료 화면 표시
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex flex-1 justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col w-full max-w-3xl gap-8">
          {/* 성공 아이콘 및 메시지 */}
          <div className="flex flex-col items-center text-center gap-4 pt-8">
            <div className="flex items-center justify-center size-24 bg-primary/20 dark:bg-primary/30 rounded-full">
              <span 
                className="material-symbols-outlined text-primary text-6xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em]">
                결제 완료
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                포우 브릿지를 이용해주셔서 감사합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* 주문 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4">주문 정보</h3>
              <div className="grid grid-cols-[100px_1fr] gap-x-6">
                <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 dark:border-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">주문번호</p>
                  <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal">
                    {order.orderUuid || `ORDER-${order.orderId}`}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 dark:border-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">결제 금액</p>
                  <p className="text-primary text-sm font-bold leading-normal">
                    {formatPrice(order.totalAmount)}원
                  </p>
                </div>
                {order.receiverName && (
                  <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 dark:border-gray-700 py-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">받는 사람</p>
                    <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal">
                      {order.receiverName}
                    </p>
                  </div>
                )}
                <div className="col-span-2 grid grid-cols-subgrid border-t border-gray-200 dark:border-gray-700 py-4 border-b">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">배송 주소</p>
                  <p className="text-text-light dark:text-text-dark text-sm font-normal leading-normal">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* 주문 상품 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4">주문 상품 목록</h3>
              <div className="flow-root">
                <ul className="-my-6 divide-y divide-gray-200 dark:divide-gray-700" role="list">
                  {order.orderItems?.map((item, index) => (
                    <li key={index} className="flex py-6">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-gray-400">inventory_2</span>
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-text-light dark:text-text-dark">
                            <h3>{item.productName}</h3>
                            <p className="ml-4">{formatPrice(item.price * item.quantity)}원</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.skuCode}</p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <p className="text-gray-500 dark:text-gray-400">수량: {item.quantity}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              to="/"
              className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-gray-900 text-base font-bold leading-normal tracking-[0.015em] hover:opacity-90"
            >
              홈으로
            </Link>
            <button
              onClick={() => alert('주문내역 페이지는 준비 중입니다.')}
              className="flex flex-1 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              주문내역 보기
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

