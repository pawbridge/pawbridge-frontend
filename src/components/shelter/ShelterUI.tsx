import { panel, control, labels, errorMessage } from './shelterView';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import ManagementBreadcrumb from '../common/ManagementBreadcrumb';
import type { ApplicationStatus } from '../../api/shelter.api';
export function Status({ status }: { status: ApplicationStatus; }) { return <span className="inline-flex rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-100">{labels[status]}</span>; }
export function Feedback({ error, retry }: { error: unknown; retry?: () => void; }) {
  return <div role="alert" className={panel}>
    <p>{errorMessage(error)}</p>{retry && <button className={`${control} mt-3`} onClick={retry}>다시 불러오기</button>}</div>;
}
export function Pagination({ page, total, change }: { page: number; total: number; change: (page: number) => void; }) {
  return <nav aria-label="페이지 이동" className="flex items-center justify-center gap-4 pt-4">
    <button className={control} disabled={page === 0} onClick={() => change(page - 1)}>이전</button>
    <span>{page + 1} / {Math.max(total, 1)}</span>
    <button className={control} disabled={page + 1 >= total} onClick={() => change(page + 1)}>다음</button>
  </nav>;
}
export function AdminShelterLayout({ title, children }: { title: string; children: ReactNode; }) {
  const { pathname } = useLocation();
  const isApplication = pathname.startsWith('/admin/shelter-applications');
  const listPath = isApplication ? '/admin/shelter-applications' : '/admin/shelters';
  const listLabel = isApplication ? '담당자 신청' : '보호소 목록';
  const detail = pathname !== listPath;
  return <AdminLayout title={title} breadcrumb={<ManagementBreadcrumb current={detail ? '상세' : listLabel} collapseAncestors={false} separatorSrc="/admin/breadcrumb-separator.svg" items={[
    { label: '관리자', to: '/admin/dashboard' },
    { label: '보호소 관리', to: '/admin/shelters' },
    ...(detail ? [{ label: listLabel, to: listPath }] : []),
  ]} />}>{children}</AdminLayout>;
}
