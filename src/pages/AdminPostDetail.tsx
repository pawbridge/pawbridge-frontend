import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAdminPostById } from '../api/post.api';
import AdminLayout from '../components/layout/AdminLayout';
import { AdminImage, AdminDetailFields, AdminError, AdminLoading, adminControl, adminPanel, adminPrimary } from '../components/admin/AdminUI';
import AdminPostEditDialog from '../components/admin/AdminPostEditDialog';
import { adminBoardLabels } from '../lib/adminPosts';
import { adminDate } from '../lib/adminUsers';

export default function AdminPostDetail() {
  const { postId } = useParams();
  const valid = Number.isSafeInteger(Number(postId)) && Number(postId) > 0;
  const [editing, setEditing] = useState(false);
  const query = useQuery({ queryKey: ['admin-post', postId], queryFn: () => getAdminPostById(Number(postId)), enabled: valid });
  const post = query.data;
  return <AdminLayout title="게시글 상세" description="글과 첨부 이미지를 확인합니다.">
    <Link to="/admin/posts" className={adminControl}>게시글 목록으로</Link>
    {!valid ? <AdminError title="올바르지 않은 게시글 번호입니다." /> : query.isPending ? <AdminLoading /> : query.isError || !post ? <AdminError title="게시글 상세 조회 실패" retry={() => void query.refetch()} /> : <>
      <section className={`${adminPanel} space-y-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="min-w-0 break-words text-xl font-bold [overflow-wrap:anywhere]">{post.title}</h2><button className={adminPrimary} onClick={() => setEditing(true)}>수정</button></div>
        <AdminDetailFields fields={[['게시판', adminBoardLabels[post.boardType]], ['작성자', post.authorNickname || post.authorName], ['작성일', adminDate(post.createdAt)], ['수정일', post.updatedAt ? adminDate(post.updatedAt) : '수정 이력 없음'], ['조회 수', String(post.viewCount ?? 0)], ['게시글 번호', String(post.postId ?? post.id)]]} />
        <h3 className="text-lg font-bold">내용</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{post.content}</p>
        {!!post.imageUrls?.length && <section className="space-y-4"><h3 className="text-lg font-bold">첨부 이미지 ({post.imageUrls.length}개)</h3><div className="grid gap-4 sm:grid-cols-2">{post.imageUrls.map((url, index) => <a key={url + index} href={url} target="_blank" rel="noopener noreferrer"><AdminImage src={url} alt={`게시글 첨부 이미지 ${index + 1}`} className="max-h-80 w-full rounded-xl border border-brand-border object-contain" /></a>)}</div></section>}
      </section>
      {editing && <AdminPostEditDialog post={post} onClose={() => setEditing(false)} />}
    </>}
  </AdminLayout>;
}
