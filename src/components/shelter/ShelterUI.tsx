import { panel, control, labels, errorMessage } from './shelterView';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminSidebar from '../layout/AdminSidebar';
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
  return <div className="flex min-h-screen bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-100">
    <div className="hidden lg:block">
      <AdminSidebar subdued />
    </div>
    <main className="min-w-0 flex-1 p-5 sm:p-8">
      <details className="mb-6 rounded-lg border border-gray-200 lg:hidden">
        <summary className="cursor-pointer p-3">관리자 메뉴</summary>
        <div className="max-h-[70vh] overflow-auto">
          <AdminSidebar subdued />
        </div>
      </details>
      <header className="mb-6 border-b border-gray-200 pb-5 text-lg font-bold">보호소 관리</header>
      <nav aria-label="현재 위치" className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link to="/admin/dashboard">관리자</Link>
        <span>/</span>
        <span>보호소 관리</span>
        <span>/</span>
        <Link to={listPath}>{listLabel}</Link>{pathname !== listPath && <>
          <span>/</span>
          <span aria-current="page">상세</span>
        </>}</nav>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="space-y-6">{children}</div>
    </main>
  </div>;
}
