import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUser } from '../../api/user.api';
import type { AdminUserListItem, UpdateUserRequest, UserRole } from '../../types/user.types';
import { userRoleLabels, validateAdminUser } from '../../lib/adminUsers';
import { errorMessage } from '../shelter/shelterView';
import StatsDialog from '../statistics/StatsDialog';
import { adminControl, adminInput, adminPrimary } from './AdminUI';

export default function AdminUserEditDialog({ member, onClose, onSaved }: { member: AdminUserListItem; onClose: () => void; onSaved: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState<UpdateUserRequest>({ nickname: member.nickname || '', role: member.role, careRegNo: member.careRegNo || '' });
  const [errors, setErrors] = useState<ReturnType<typeof validateAdminUser>>({});
  const mutation = useMutation({
    mutationFn: () => updateUser(member.userId, { ...form, careRegNo: form.careRegNo?.trim() }),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: ['admin-users'] }), client.invalidateQueries({ queryKey: ['admin-user', String(member.userId)] })]);
      onSaved(); onClose();
    },
  });
  return <StatsDialog compact title="회원 정보 수정" busy={mutation.isPending} onClose={onClose}>
    <p className="mb-5 break-words text-sm">{member.name} · <span className="break-all">{member.email}</span></p>
    <form noValidate className="space-y-5" onSubmit={event => { event.preventDefault(); if (mutation.isPending) return; const found = validateAdminUser(form); setErrors(found); if (!Object.keys(found).length) mutation.mutate(); }}>
      <fieldset disabled={mutation.isPending} className="space-y-5">
        <div><label htmlFor="member-nickname" className="text-sm font-medium">닉네임 (선택)</label><input id="member-nickname" className={adminInput} value={form.nickname || ''} maxLength={10} aria-invalid={!!errors.nickname} aria-describedby="nickname-help" onChange={event => setForm({ ...form, nickname: event.target.value })} /><p id="nickname-help" className={`mt-2 text-xs ${errors.nickname ? 'text-red-700 dark:text-red-300' : 'text-brand-muted dark:text-stone-300'}`}>{errors.nickname || '2~10자의 한글, 영문, 숫자를 사용할 수 있습니다.'}</p></div>
        <div><label htmlFor="member-role" className="text-sm font-medium">회원 유형</label><select id="member-role" className={adminInput} value={form.role} onChange={event => setForm({ ...form, role: event.target.value as UserRole })}>{Object.entries(userRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div><label htmlFor="member-registration" className="text-sm font-medium">보호소 등록번호{form.role === 'ROLE_SHELTER' ? ' (필수)' : ''}</label><input id="member-registration" className={adminInput} value={form.careRegNo || ''} aria-invalid={!!errors.careRegNo} aria-describedby="registration-help" onChange={event => setForm({ ...form, careRegNo: event.target.value })} /><p id="registration-help" className={`mt-2 text-xs ${errors.careRegNo ? 'text-red-700 dark:text-red-300' : 'text-brand-muted dark:text-stone-300'}`}>{errors.careRegNo || '보호소 회원에게는 소속을 확인한 등록번호가 필요합니다.'}</p></div>
      </fieldset>
      {mutation.isError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{errorMessage(mutation.error)} 입력 내용을 유지했습니다. 다시 확인한 뒤 저장해 주세요.</p>}
      <div className="flex flex-wrap justify-end gap-3"><button type="button" className={adminControl} disabled={mutation.isPending} onClick={onClose}>취소</button><button className={adminPrimary} disabled={mutation.isPending}>{mutation.isPending ? '저장 중…' : '저장'}</button></div>
    </form>
  </StatsDialog>;
}
