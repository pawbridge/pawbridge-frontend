import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrderById, updateOrderStatus, updateDeliveryStatus } from '../api/orders.api';
import type { AdminOrderDetail as Order, OrderStatus, DeliveryStatus } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import StatsDialog from '../components/statistics/StatsDialog';
import { AdminDetailFields, AdminError, AdminLoading, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminOrderLabels, adminDeliveryLabels } from '../lib/adminMarket';
import { adminDate } from '../lib/adminUsers';

function OrderEditor({ order, refresh }: { order: Order; refresh: () => Promise<Order> }) {
  const [status, setStatus] = useState(order.status);
  const [delivery, setDelivery] = useState(order.deliveryStatus);
  const [confirming, setConfirming] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [notice, setNotice] = useState('');
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: async () => {
    // Existing independent PATCH contracts: a partial success is not an atomic rollback.
    if (status !== order.status) await updateOrderStatus(order.orderId, { status });
    if (delivery !== order.deliveryStatus) await updateDeliveryStatus(order.orderId, { deliveryStatus: delivery });
    await refresh();
  }, onSuccess: () => { setConfirming(false); setNotice('변경사항을 저장했습니다.'); void client.invalidateQueries({ queryKey: ['admin-orders'] }); }, onError: () => { setUncertain(true); setNotice('변경 일부가 반영되었을 수 있습니다. 최신 상태를 먼저 확인해 주세요.'); } });
  const busy = mutation.isPending || recovering;
  const recover = async () => {
    setRecovering(true);
    try { const latest = await refresh(); setStatus(latest.status); setDelivery(latest.deliveryStatus); setUncertain(false); setConfirming(false); setNotice('최신 상태를 확인했습니다.'); }
    catch { setNotice('최신 상태 조회에 실패했습니다. 요청을 반복하지 말고 다시 확인해 주세요.'); }
    finally { setRecovering(false); }
  };
  return <section className={`${adminPanel} space-y-4`}><h2 className="break-words text-xl font-bold">{order.orderUuid}</h2>
    <fieldset disabled={busy || uncertain} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">주문 상태<select className={adminInput} value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>{Object.entries(adminOrderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">배송 상태<select className={adminInput} value={delivery} onChange={e => setDelivery(e.target.value as DeliveryStatus)}>{Object.entries(adminDeliveryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </fieldset>
    {!uncertain && <button className={adminPrimary} disabled={busy || (status === order.status && delivery === order.deliveryStatus)} onClick={() => { setNotice(''); setConfirming(true); }}>변경 저장</button>}
    {uncertain && <button className={adminControl} disabled={busy} onClick={recover}>최신 상태 확인</button>}
    {notice && <p role="status" className="text-sm">{notice}</p>}
    <p className="text-xs text-brand-muted">상태 변경은 결제 승인·환불·송장 등록 기능이 아닙니다.</p>
    {confirming && <StatsDialog compact title="주문 상태를 변경하시겠어요?" busy={busy} onClose={() => setConfirming(false)}>
      <div className="space-y-4"><p className="text-sm">주문: {adminOrderLabels[order.status]} → {adminOrderLabels[status]}</p><p className="text-sm">배송: {adminDeliveryLabels[order.deliveryStatus]} → {adminDeliveryLabels[delivery]}</p>
        {uncertain && <p role="alert" className="text-sm text-red-700">{notice}</p>}
        <div className="flex flex-wrap gap-2"><button disabled={busy} className={adminControl} onClick={() => setConfirming(false)}>취소</button>{uncertain ? <button disabled={busy} className={adminPrimary} onClick={recover}>최신 상태 확인</button> : <button disabled={busy} className={adminPrimary} onClick={() => mutation.mutate()}>{busy ? '저장 중…' : '확인하고 저장'}</button>}</div>
      </div>
    </StatsDialog>}
  </section>;
}
export default function AdminOrderDetail() {
  const { orderId } = useParams();
  const valid = Number.isSafeInteger(Number(orderId)) && Number(orderId) > 0;
  const query = useQuery({ queryKey: ['admin-order', orderId], queryFn: () => getAdminOrderById(Number(orderId)), enabled: valid });
  const order = query.data;
  return <AdminLayout title="주문 상세" description="주문·배송 정보와 상품별 금액을 확인합니다.">
    <Link to="/admin/orders" className={adminControl}>주문 목록으로</Link>
    {!valid ? <AdminError title="올바르지 않은 주문 번호입니다." /> : query.isPending ? <AdminLoading /> : query.isError || !order ? <AdminError title="주문 상세 조회 실패" retry={() => void query.refetch()} /> : <>
      <OrderEditor key={order.orderId} order={order} refresh={async () => { const latest = await query.refetch(); if (latest.isError || !latest.data) throw new Error('refresh failed'); return latest.data; }} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">주문 정보</h2><AdminDetailFields fields={[['주문 번호', order.orderUuid], ['회원 번호', String(order.userId)], ['주문일', adminDate(order.createdAt)], ['결제 금액', order.totalAmount.toLocaleString() + '원']]} /></section>
        <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">배송 정보</h2><AdminDetailFields fields={[['수령인', order.receiverName], ['연락처', order.receiverPhone], ['주소', order.deliveryAddress], ['배송 메모', order.deliveryMessage || '메모 없음']]} /></section>
      </div>
      <section className={`${adminPanel} space-y-4`}><h2 className="text-xl font-bold">주문 상품과 금액</h2><ul className="space-y-4">{order.items.map((item, index) => <li key={item.orderItemId ?? index} className="space-y-2 border-b border-brand-border pb-4"><p className="break-words text-sm font-medium">{item.productName} · {item.skuCode}</p><p className="text-sm">{item.price.toLocaleString()}원 × {item.quantity}개 = {(item.price * item.quantity).toLocaleString()}원</p></li>)}</ul><p className="text-sm">상품 합계 {order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}원 · 결제 금액 {order.totalAmount.toLocaleString()}원</p></section>
    </>}
  </AdminLayout>;
}

