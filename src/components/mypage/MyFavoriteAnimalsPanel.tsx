import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { FavoriteListResponse } from '../../types/api.types';
import FavoriteAnimalCard from '../animals/FavoriteAnimalCard';
import MyPageListState, { type MyPageListFeedback } from './MyPageListState';

interface MyFavoriteAnimalsPanelProps {
  feedback: MyPageListFeedback;
  favoriteAnimals: FavoriteListResponse | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function MyFavoriteAnimalsPanel({ feedback, favoriteAnimals, currentPage, onPageChange }: MyFavoriteAnimalsPanelProps) {
  const pageSize = 12;
  const favorites = favoriteAnimals?.favorites ?? [];
  const totalPages = Math.ceil(favorites.length / pageSize);
  const visiblePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const pageItems = favorites.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  useEffect(() => {
    if (favoriteAnimals && currentPage !== visiblePage) onPageChange(visiblePage);
  }, [favoriteAnimals, currentPage, visiblePage, onPageChange]);
  return (
    <>
      <h2 className="border-b border-border-light pb-6 text-[22px] font-bold dark:border-border-dark">관심 동물</h2>
      <MyPageListState label="관심 동물을" {...feedback}>
        {favorites.length ? (
          <div className="mt-8">
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">관심 동물 {favoriteAnimals?.totalCount ?? favorites.length}마리</p>
            <div className="grid gap-5 2xl:grid-cols-2">
              {pageItems.map(favorite => <FavoriteAnimalCard key={favorite.favoriteId} favorite={favorite} fromMyPage />)}
            </div>
            {totalPages > 1 && (
              <nav aria-label="관심 동물 페이지" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button type="button" onClick={() => onPageChange(Math.max(0, visiblePage - 1))} disabled={visiblePage === 0} className="min-h-11 rounded-lg border border-border-light px-4 disabled:opacity-50">이전</button>
                {Array.from({ length: totalPages }, (_, page) => (
                  <button key={page} type="button" onClick={() => onPageChange(page)} aria-current={visiblePage === page ? 'page' : undefined} aria-label={String(page + 1) + '페이지'} className={'min-h-11 min-w-11 rounded-lg px-3 ' + (visiblePage === page ? 'bg-brand font-bold text-brand-ink' : 'border border-border-light')}>{page + 1}</button>
                ))}
                <button type="button" onClick={() => onPageChange(Math.min(totalPages - 1, visiblePage + 1))} disabled={visiblePage >= totalPages - 1} className="min-h-11 rounded-lg border border-border-light px-4 disabled:opacity-50">다음</button>
              </nav>
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-border-light px-5 py-12 text-center dark:border-border-dark">
            <p className="font-semibold">아직 관심 동물이 없습니다</p>
            <Link to="/animals" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-6 font-semibold text-brand-ink">동물 찾아보기</Link>
          </div>
        )}
      </MyPageListState>
    </>
  );
}
