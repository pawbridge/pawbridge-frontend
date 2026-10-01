import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePost } from '../../api/post.api';
import type { PostResponse, UpdatePostRequest } from '../../types/api.types';
import StatsDialog from '../statistics/StatsDialog';
import { adminControl, adminInput, adminPrimary } from './AdminUI';

export default function AdminPostEditDialog({ post, onClose }: { post: PostResponse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [validation, setValidation] = useState('');
  const id = post.postId ?? post.id;
  const mutation = useMutation({ mutationFn: (data: UpdatePostRequest) => updatePost(id, data), onSuccess: async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-posts'] }), queryClient.invalidateQueries({ queryKey: ['admin-post', String(id)] })]);
    onClose();
  } });
  return <StatsDialog compact title="게시글 수정" busy={mutation.isPending} onClose={onClose}>
    <form className="space-y-4" onSubmit={event => {
      event.preventDefault();
      if (mutation.isPending) return;
      if (!title.trim() || title.length > 200 || !content.trim()) { setValidation('제목은 1~200자, 내용은 1자 이상 입력해 주세요.'); return; }
      const data = { ...(title !== post.title && { title }), ...(content !== post.content && { content }) };
      if (!Object.keys(data).length) { setValidation('변경된 내용이 없습니다.'); return; }
      setValidation(''); mutation.mutate(data);
    }}>
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <label className="block text-sm font-medium">제목 (필수)<input className={adminInput} maxLength={200} value={title} onChange={event => setTitle(event.target.value)} /></label>
        <label className="block text-sm font-medium">내용 (필수)<textarea className={`${adminInput} min-h-40 resize-y`} value={content} onChange={event => setContent(event.target.value)} /></label>
      </fieldset>
      {validation && <p role="alert" className="text-sm text-red-700">{validation}</p>}
      {mutation.isError && <p role="alert" className="text-sm text-red-700">저장에 실패했습니다. 입력 내용을 보존했으니 확인 후 다시 시도해 주세요.</p>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={mutation.isPending} className={adminControl} onClick={onClose}>취소</button><button type="submit" disabled={mutation.isPending} className={adminPrimary}>{mutation.isPending ? '저장 중…' : '저장'}</button></div>
    </form>
  </StatsDialog>;
}
