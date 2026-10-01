import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminUserById } from '../api/user.api';
import AdminLayout from '../components/layout/AdminLayout';
import AdminUserEditDialog from '../components/admin/AdminUserEditDialog';
import { AdminDetailFields, AdminError, AdminLoading, adminControl, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminDate, userRoleLabels } from '../lib/adminUsers';

export default function AdminUserDetail() {
  const { userId = '' } = useParams();
  const validId = /^\d+$/.test(userId) && Number.isSafeInteger(Number(userId)) && Number(userId) > 0;
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const query = useQuery({ queryKey: ['admin-user', userId], queryFn: () => getAdminUserById(Number(userId)), enabled: validId });
  return <AdminLayout title="회원 상세">
    <Link to="/admin/users" className={adminControl}>회원 목록으로</Link>
    {!validId ? <AdminError title="잘못된 회원 주소입니다." /> : query.isPending ? <AdminLoading label="회원 정보를 불러오는 중입니다." /> : query.isError ? <AdminError title="회원 정보 조회 실패" retry={() => void query.refetch()} /> : <section className={`${adminPanel} space-y-5`}>
      <h2 className="break-words text-[28px] font-bold">{query.data.name}</h2>
      <p className="text-sm text-brand-muted dark:text-stone-300">{userRoleLabels[query.data.role]} · 가입 {adminDate(query.data.createdAt)}</p>
      <AdminDetailFields fields={[['이메일', query.data.email], ['이름', query.data.name], ['닉네임', query.data.nickname], ['회원 유형', userRoleLabels[query.data.role]], ['가입일', adminDate(query.data.createdAt)], ['보호소 등록번호', query.data.careRegNo], ['가입 방법', query.data.provider || 'LOCAL']]} />
      {message && <p role="status" className="text-sm">{message}</p>}
      <button className={adminPrimary} onClick={() => setEditing(true)}>회원 정보 수정</button>
    </section>}
    {editing && query.data && <AdminUserEditDialog member={query.data} onClose={() => setEditing(false)} onSaved={() => setMessage('회원 정보가 수정되었습니다.')} />}
  </AdminLayout>;
}
