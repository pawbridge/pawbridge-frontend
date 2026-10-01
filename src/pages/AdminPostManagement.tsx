import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePost, getAdminPosts } from '../api/post.api';
import type { BoardType, PostResponse } from '../types/api.types';
import AdminLayout from '../components/layout/AdminLayout';
import { AdminEmpty, AdminError, AdminLoading, AdminPagination, AdminRecord, adminControl, adminInput, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import AdminPostEditDialog from '../components/admin/AdminPostEditDialog';
import AdminDeleteDialog from '../components/admin/AdminDeleteDialog';
import { adminBoardLabels } from '../lib/adminPosts';
import { adminDate } from '../lib/adminUsers';

export default function AdminPostManagement() {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [board, setBoard] = useState<BoardType | ''>('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<PostResponse | null>(null);
  const [deleting, setDeleting] = useState<PostResponse | null>(null);
  const query = useQuery({ queryKey: ['admin-posts'], queryFn: () => getAdminPosts({ page: 0, size: 1000, sort: 'createdAt,desc' }) });
  const filtered = (query.data?.content ?? []).filter(post => (!board || post.boardType === board) && [post.title, post.content, post.authorNickname].some(value => value?.toLowerCase().includes(keyword.trim().toLowerCase())));
  const total = Math.ceil(filtered.length / 20);
  const currentPage = Math.min(page, Math.max(0, total - 1));
  const reset = () => { setKeyword(''); setBoard(''); setPage(0); };
  return <AdminLayout title="게시글 관리" description="게시판별 글을 확인하고 수정·삭제합니다.">
    <section className={adminPanel}><div className="grid gap-4 sm:grid-cols-[200px_1fr_auto] sm:items-end">
      <label className="text-sm font-medium">게시판<select className={adminInput} value={board} onChange={e => { setBoard(e.target.value as BoardType | ''); setPage(0); }}><option value="">전체 게시판</option>{Object.entries(adminBoardLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-medium">제목·내용·작성자 검색<input className={adminInput} value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} /></label>
      <button className={adminControl} onClick={reset}>초기화</button>
    </div></section>
    {query.isPending ? <AdminLoading label="게시글 목록을 불러오는 중입니다." /> : query.isError ? <AdminError title="게시글 목록 조회 실패" retry={() => void query.refetch()} /> : <section className={`${adminPanel} space-y-4`}>
      <h2 className="text-lg font-bold">조회된 게시글 {filtered.length.toLocaleString()}건</h2>
      {(query.data?.totalElements ?? 0) > (query.data?.content.length ?? 0) && <p className="text-sm text-brand-muted">최근 1,000건 안에서 검색합니다. 전체 게시글 수가 아닙니다.</p>}
      {filtered.length === 0 ? <AdminEmpty title="검색 결과가 없습니다."><button className={adminControl} onClick={reset}>조건 초기화</button></AdminEmpty> : <ul className="space-y-3">{filtered.slice(currentPage * 20, (currentPage + 1) * 20).map(post => {
        const id = post.postId ?? post.id;
        return <AdminRecord key={id} title={post.title} description={post.authorNickname || post.authorName} meta={`게시글 ${id} · ${adminDate(post.createdAt)} · 조회 ${post.viewCount ?? 0}`} status={<span className="rounded-lg bg-brand-soft px-3 py-2 text-xs">{adminBoardLabels[post.boardType]}</span>}>
          <Link className={adminPrimary} to={`/admin/posts/${id}`}>상세 보기</Link><button className={adminControl} onClick={() => setEditing(post)}>수정</button><button className={`${adminControl} text-red-700`} onClick={() => setDeleting(post)}>삭제</button>
        </AdminRecord>;
      })}</ul>}
      <AdminPagination page={currentPage} total={total} onChange={setPage} />
    </section>}
    {editing && <AdminPostEditDialog post={editing} onClose={() => setEditing(null)} />}
    {deleting && <AdminDeleteDialog name={deleting.title} run={() => deletePost(deleting.postId ?? deleting.id)} refresh={async () => { await client.invalidateQueries({ queryKey: ['admin-posts'] }); const result = await query.refetch(); if (result.isError) throw new Error('refresh failed'); }} onClose={() => setDeleting(null)} />}
  </AdminLayout>;
}
