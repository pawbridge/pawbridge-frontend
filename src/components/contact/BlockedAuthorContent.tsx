import { useState, type ReactNode } from 'react';
import { contactButton } from './ContactLayout';
import type { useBlockedAuthors } from './useBlockedAuthors';

type BlockState = ReturnType<typeof useBlockedAuthors>;

export default function BlockedAuthorContent({ state, authorId, children, tableColumns }: {
  state: BlockState;
  authorId: number;
  children: ReactNode;
  tableColumns?: number;
}) {
  if (authorId === state.owner) return <>{children}</>;
  // Keyed state is reset across accounts and block/unblock transitions.
  return <AuthorVisibility key={`${state.owner}:${state.memberIds.has(authorId)}`} state={state}
    blocked={state.memberIds.has(authorId)} tableColumns={tableColumns}>{children}</AuthorVisibility>;
}

function AuthorVisibility({ state, blocked, children, tableColumns }: {
  state: BlockState;
  blocked: boolean;
  children: ReactNode;
  tableColumns?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  let notice: ReactNode;
  if (state.pending) notice = <p role="status">차단 여부를 확인하는 중입니다…</p>;
  else if (state.failed) notice = <div role="alert"><p>차단 여부를 확인하지 못했어요.</p>
    <button type="button" className={`${contactButton} mt-3`} onClick={state.retry}>다시 시도</button></div>;
  else if (blocked && !expanded) notice = <div><p>차단한 회원의 글입니다.</p>
    <button type="button" className={`${contactButton} mt-3`} aria-expanded={false}
      onClick={() => setExpanded(true)}>이 글 보기</button></div>;
  else return <>{children}</>;

  // 안내 영역 클릭이 바깥 행(커뮤니티 목록 행 이동)으로 올라가지 않게 막을 뿐, 이 div는 조작 요소가 아니다.
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  const placeholder = <div className="rounded-xl bg-brand-soft p-5 text-sm leading-6 text-brand-ink dark:bg-gray-800 dark:text-white"
    onClick={event => event.stopPropagation()}>{notice}</div>;
  return tableColumns ? <td colSpan={tableColumns} className="p-3" onClick={event => event.stopPropagation()}>{placeholder}</td> : placeholder;
}
