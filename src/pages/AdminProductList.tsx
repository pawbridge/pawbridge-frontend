import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, deleteProduct } from '../api/products.api';
import type { ProductListItem, ProductStatus } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import { AdminImage, AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import AdminDeleteDialog from '../components/admin/AdminDeleteDialog';
import { adminProductLabels } from '../lib/adminMarket';

export default function AdminProductList() {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);
  const params = { page, size: 20, sortBy: 'createdAt' as const, sortOrder: 'desc' as const, ...(keyword && { keyword }), ...(status && { status }) };
  const query = useQuery({ queryKey: ['admin-products', params], queryFn: () => getProducts(params) });
  return <AdminLayout title="상품 목록" description="상품의 판매 상태와 SKU별 가격·재고를 확인합니다.">
    <Link to="/products/new" className={adminPrimary}>상품 등록</Link>
    <section className={adminPanel}><div className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
      <label className="text-sm font-medium">상품 검색<input className={adminInput} value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} /></label>
      <label className="text-sm font-medium">판매 상태<select className={adminInput} value={status} onChange={e => { setStatus(e.target.value as ProductStatus | ''); setPage(0); }}><option value="">전체</option>{Object.entries(adminProductLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className={adminControl} onClick={() => { setKeyword(''); setStatus(''); setPage(0); }}>초기화</button>
    </div></section>
    {query.isPending ? <AdminLoading /> : query.isError ? <AdminError title="상품 목록 조회 실패" retry={() => void query.refetch()} /> : <section className={`${adminPanel} space-y-4`}>
      <h2 className="text-lg font-bold">상품 검색 결과 {query.data?.totalCount.toLocaleString()}건</h2>
      {!query.data?.items.length ? <AdminEmpty title="검색 결과가 없습니다." /> : <ul className="space-y-3">{query.data.items.map(product => <AdminRecord key={product.skuId} title={<span className="flex items-center gap-4">{product.imageUrl && <AdminImage src={product.imageUrl} alt="상품 대표 이미지" className="size-16 shrink-0 rounded-lg object-cover" />}<span className="min-w-0 break-words">{product.name}</span></span>} description={product.optionName || '옵션 없음'} meta={`${product.price.toLocaleString()}원 · 재고 ${product.totalStock.toLocaleString()}개 · SKU ${product.skuId}`} status={<span className="rounded-lg bg-brand-soft px-3 py-2 text-xs">{product.status ? adminProductLabels[product.status] : '상태 정보 없음'}</span>}>
        <Link to={`/admin/products/${product.id}/edit`} className={adminPrimary}>수정</Link><button className={`${adminControl} text-red-700`} onClick={() => setDeleting(product)}>삭제</button>
      </AdminRecord>)}</ul>}
      <AdminPagination page={page} total={query.data?.totalPages ?? 0} onChange={setPage} />
    </section>}
    {deleting && <AdminDeleteDialog name={deleting.name} run={() => deleteProduct(deleting.id)} refresh={async () => { await client.invalidateQueries({ queryKey: ['admin-products'] }); const result = await query.refetch(); if (result.isError) throw new Error('refresh failed'); if (!result.data?.items.length && page > 0) setPage(page - 1); }} onClose={() => setDeleting(null)} />}
  </AdminLayout>;
}

