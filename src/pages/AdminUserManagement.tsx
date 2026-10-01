import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteUser, getAdminUsers } from '../api/user.api';
import type { AdminUserListItem, UserRole } from '../types/user.types';
import AdminLayout from '../components/layout/AdminLayout';
import AdminUserEditDialog from '../components/admin/AdminUserEditDialog';
import StatsDialog from '../components/statistics/StatsDialog';
import { AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import { adminDate, userRoleLabels } from '../lib/adminUsers';

export default function AdminUserManagement() {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<AdminUserListItem | null>(null);
  const [deleting, setDeleting] = useState<AdminUserListItem | null>(null);
  const [message, setMessage] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const query = useQuery({ queryKey: ['admin-users'], queryFn: () => getAdminUsers({ page: 0, size: 1000, sortBy: 'createdAt', sortOrder: 'desc' }) });
  const deletion = useMutation({
    mutationFn: (member: AdminUserListItem) => deleteUser(member.userId),
    onSuccess: async (_, member) => {
      await Promise.all([client.invalidateQueries({ queryKey: ['admin-users'] }), client.invalidateQueries({ queryKey: ['admin-user', String(member.userId)] })]);
      setDeleting(null); setMessage('회원이 삭제되었습니다.');
    },
  });
  const filtered = (query.data?.content || []).filter(member => (role === 'ALL' || member.role === role) && (member.email.toLowerCase().includes(keyword.toLowerCase()) || member.nickname?.toLowerCase().includes(keyword.toLowerCase())));
  const totalPages = Math.ceil(filtered.length / 20);
  const visiblePage = Math.min(page, Math.max(0, totalPages - 1));
  return <AdminLayout title="회원 관리" description="조회된 회원의 정보와 권한을 확인하고 관리하세요.">
    <form className={`${adminPanel} flex flex-col items-end gap-4 lg:flex-row`} onSubmit={event => event.preventDefault()}>
      <div className="w-full min-w-0 flex-1"><label htmlFor="member-search" className="text-sm font-medium">회원 검색</label><div className="relative"><img alt="" src="/admin/search.svg" width="20" height="20" className="absolute left-4 top-6" /><input id="member-search" className={`${adminInput} pl-12`} placeholder="이메일 또는 닉네임" value={keyword} onChange={event => { setKeyword(event.target.value); setPage(0); }} /></div></div>
      <div className="w-full lg:w-80"><label htmlFor="member-filter" className="text-sm font-medium">회원 유형</label><select id="member-filter" className={adminInput} value={role} onChange={event => { setRole(event.target.value as UserRole | 'ALL'); setPage(0); }}><option value="ALL">전체 회원</option>{Object.entries(userRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <button className={`${adminPrimary} w-full lg:w-auto`}>검색</button>
    </form>
    {message && <p role="status" className="text-sm">{message}</p>}
    {query.isPending ? <AdminLoading label="회원 목록을 불러오는 중입니다." /> : query.isError ? <AdminError title="회원 목록 조회 실패" retry={() => void query.refetch()} /> : <>
      <p className="text-sm font-medium">조회된 회원 {filtered.length.toLocaleString()}명</p>
      {query.data.totalElements > query.data.content.length && <p className="text-xs text-brand-muted dark:text-stone-300">최근 {query.data.content.length.toLocaleString()}명 안에서 검색합니다. 전체 회원 {query.data.totalElements.toLocaleString()}명을 모두 조회한 결과는 아닙니다.</p>}
      {!filtered.length ? <AdminEmpty title="검색 결과가 없습니다."><button className={adminControl} onClick={() => { setKeyword(''); setRole('ALL'); setPage(0); }}>검색 조건 초기화</button></AdminEmpty> : <ul className="space-y-4">{filtered.slice(visiblePage * 20, (visiblePage + 1) * 20).map(member =>
        <AdminRecord key={member.userId} title={member.name} description={member.email} meta={`가입 ${adminDate(member.createdAt)}${member.nickname ? ' · ' + member.nickname : ''}`} status={<span className="inline-flex rounded-full bg-stone-100 px-3 py-2 text-xs dark:bg-stone-800">{userRoleLabels[member.role]}</span>}>
          <Link className={adminControl} to={`/admin/users/${member.userId}`}>상세 보기</Link>
          <button className={adminControl} onClick={() => setEditing(member)}>수정</button>
          <button className={adminControl} onClick={() => { deletion.reset(); setDeleting(member); }}>삭제</button>
        </AdminRecord>)}</ul>}
      <AdminPagination page={visiblePage} total={totalPages} onChange={setPage} />
    </>}
    {editing && <AdminUserEditDialog member={editing} onClose={() => setEditing(null)} onSaved={() => setMessage('회원 정보가 수정되었습니다.')} />}
    {deleting && <StatsDialog compact title="회원을 삭제하시겠어요?" busy={deletion.isPending || recovering} onClose={() => setDeleting(null)}>
      <div className="space-y-4 text-sm"><p className="break-words font-medium">{deleting.name} · {userRoleLabels[deleting.role]}</p><p className="break-all text-brand-muted dark:text-stone-300">{deleting.email}</p><p>회원 삭제는 되돌릴 수 없습니다. 대상 회원을 다시 확인해 주세요.</p>
      {deletion.isError ? <><p role="alert" className="text-red-700 dark:text-red-300">삭제 결과를 확인하지 못했습니다. 중복 요청하지 말고 최신 목록에서 처리 결과를 확인해 주세요.</p>{recoveryFailed && <p role="alert">최신 목록 조회에 실패했습니다. 잠시 후 다시 확인해 주세요.</p>}<button className={adminPrimary} disabled={recovering} onClick={async () => { setRecovering(true); setRecoveryFailed(false); const result = await query.refetch(); setRecovering(false); if (result.isError) setRecoveryFailed(true); else setDeleting(null); }}>최신 목록 확인</button></> : <div className="flex flex-wrap justify-end gap-3"><button className={adminControl} disabled={deletion.isPending} onClick={() => setDeleting(null)}>취소</button><button className={adminPrimary} disabled={deletion.isPending} onClick={() => deletion.mutate(deleting)}>{deletion.isPending ? '삭제 중…' : '삭제'}</button></div>}
      </div>
    </StatsDialog>}
  </AdminLayout>;
}

