import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminOrders } from '../api/orders.api';
import type { OrderStatus, DeliveryStatus } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import { AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminOrderLabels, adminDeliveryLabels } from '../lib/adminMarket';
import { adminDate } from '../lib/adminUsers';

export default function AdminOrderList() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [delivery, setDelivery] = useState<DeliveryStatus | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const query = useQuery({ queryKey: ['admin-orders', keyword, status, delivery, sortBy, sortOrder, page], queryFn: () => getAdminOrders({ page, size: 20, sortBy, sortOrder, ...(keyword && { keyword }), ...(status && { status }), ...(delivery && { deliveryStatus: delivery }) }) });
  const reset = () => { setKeyword(''); setStatus(''); setDelivery(''); setSortBy('createdAt'); setSortOrder('desc'); setPage(0); };
  return <AdminLayout title="주문 관리" description="주문과 배송 상태를 확인합니다.">
    <section className={`${adminPanel} space-y-4`}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <label className="text-sm font-medium">주문 검색<input className={adminInput} value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} /></label>
      <label className="text-sm font-medium">주문 상태<select className={adminInput} value={status} onChange={e => { setStatus(e.target.value as OrderStatus | ''); setPage(0); }}><option value="">전체</option>{Object.entries(adminOrderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">배송 상태<select className={adminInput} value={delivery} onChange={e => { setDelivery(e.target.value as DeliveryStatus | ''); setPage(0); }}><option value="">전체</option>{Object.entries(adminDeliveryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">정렬 기준<select className={adminInput} value={sortBy} onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(0); }}><option value="createdAt">주문일</option><option value="totalAmount">결제 금액</option><option value="status">주문 상태</option></select></label>
      <label className="text-sm font-medium">정렬 순서<select className={adminInput} value={sortOrder} onChange={e => { setSortOrder(e.target.value as typeof sortOrder); setPage(0); }}><option value="desc">내림차순</option><option value="asc">오름차순</option></select></label>
    </div><button className={adminControl} onClick={reset}>초기화</button></section>
    {query.isPending ? <AdminLoading /> : query.isError ? <AdminError title="주문 목록 조회 실패" retry={() => void query.refetch()} /> : <section className={`${adminPanel} space-y-4`}>
      <h2 className="text-lg font-bold">주문 {query.data?.totalElements.toLocaleString()}건</h2>
      {!query.data?.content.length ? <AdminEmpty title="검색 결과가 없습니다." /> : <ul className="space-y-3">{query.data.content.map(order => <AdminRecord key={order.orderId} title={order.orderUuid} description={`${order.receiverName} · 회원 ${order.userId}`} meta={`${adminDate(order.createdAt)} · ${order.totalAmount.toLocaleString()}원 · 상품 ${order.items.length}종`} status={<div className="flex flex-wrap gap-2"><span className="rounded-lg bg-brand-soft px-3 py-2 text-xs">{adminOrderLabels[order.status]}</span><span className="rounded-lg bg-stone-100 px-3 py-2 text-xs">{adminDeliveryLabels[order.deliveryStatus]}</span></div>}>
        <Link to={`/admin/orders/${order.orderId}`} className={adminPrimary}>상세 보기</Link>
      </AdminRecord>)}</ul>}
      <AdminPagination page={page} total={query.data?.totalPages ?? 0} onChange={setPage} />
    </section>}
  </AdminLayout>;
}

