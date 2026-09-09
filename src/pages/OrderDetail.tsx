import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '../api/orders.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuthStore } from '../store/authStore';

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 주문 상세 조회 (테스트용: user?.id 체크 제거)
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId, user?.id || 'test'],
    queryFn: () => getOrderById(Number(orderId)),
    enabled: !!orderId, // 테스트용: orderId만 있으면 활성화
  });

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 금액 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  // 주문 상태 배지
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: '주문 대기',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      PAID: {
        label: '결제 완료',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      COMPLETED: {
        label: '주문 완료',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      CANCELLED: {
        label: '주문 취소',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
      FAILED: {
        label: '결제 실패',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-10 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">주문 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-10 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-500 mb-4">주문 정보를 불러올 수 없습니다.</p>
              <button
                onClick={() => navigate('/orders')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                주문 내역으로 돌아가기
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const totalItemsPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 0; // 배송비는 API에 포함되지 않을 수 있음

  return (
    <>
      <Header />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-10 py-8">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap gap-2 mb-6 text-sm">
          <button onClick={() => navigate('/')} className="text-text-secondary hover:underline">
            Home
          </button>
          <span className="text-text-secondary">/</span>
          <button onClick={() => navigate('/orders')} className="text-text-secondary hover:underline">
            주문 내역
          </button>
          <span className="text-text-secondary">/</span>
          <span className="text-text-main dark:text-white font-semibold">주문 상세</span>
        </nav>

        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-text-main dark:text-white">
              주문 상세
            </h1>
            <p className="text-text-secondary">주문 번호: {order.orderUuid}</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border-color rounded-lg text-text-main font-bold hover:bg-gray-50 transition-colors dark:bg-[#1a2e22] dark:border-[#2a4034] dark:text-white dark:hover:bg-[#25382c]"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            목록으로 돌아가기
          </button>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-border-color p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">주문 상태</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary mb-1">주문 일시</p>
              <p className="text-sm font-medium text-text-main dark:text-white">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-border-color p-6 mb-6">
          <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">배송 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">수령인</p>
              <p className="text-base font-medium text-text-main dark:text-white">{order.receiverName}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary mb-1">연락처</p>
              <p className="text-base font-medium text-text-main dark:text-white">{order.receiverPhone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-text-secondary mb-1">배송 주소</p>
              <p className="text-base font-medium text-text-main dark:text-white">{order.deliveryAddress}</p>
            </div>
            {order.deliveryMessage && (
              <div className="md:col-span-2">
                <p className="text-sm text-text-secondary mb-1">배송 메시지</p>
                <p className="text-base font-medium text-text-main dark:text-white">{order.deliveryMessage}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-border-color p-6 mb-6">
          <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">주문 상품</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-border-color last:border-0">
                <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 border border-border-color"></div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-main dark:text-white mb-1">{item.productName}</h3>
                  <p className="text-sm text-text-secondary mb-2">SKU: {item.skuCode}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary">
                      {formatPrice(item.price)}원 × {item.quantity}개
                    </p>
                    <p className="font-bold text-text-main dark:text-white">
                      {formatPrice(item.price * item.quantity)}원
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-border-color p-6">
          <h2 className="text-lg font-bold text-text-main dark:text-white mb-4">결제 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">상품 금액</span>
              <span className="font-medium text-text-main dark:text-white">{formatPrice(totalItemsPrice)}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">배송비</span>
              <span className="font-medium text-text-main dark:text-white">{formatPrice(shippingFee)}원</span>
            </div>
            <div className="border-t border-border-color pt-3 flex justify-between">
              <span className="text-lg font-bold text-text-main dark:text-white">총 결제 금액</span>
              <span className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}원</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

