import MyPageListState, { type MyPageListFeedback } from './MyPageListState';
import { Link } from 'react-router-dom';
import type { FavoriteListResponse } from '../../types/api.types';

interface MyFavoriteAnimalsPanelProps {
  feedback: MyPageListFeedback;
  favoriteAnimals: FavoriteListResponse | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function MyFavoriteAnimalsPanel({
  feedback,
  favoriteAnimals,
  currentPage,
  onPageChange,
}: MyFavoriteAnimalsPanelProps) {
  const pageSize = 12;
  const paginatedFavoriteAnimals = {
    items: favoriteAnimals?.favorites?.slice(currentPage * pageSize, (currentPage + 1) * pageSize) ?? [],
    totalPages: Math.ceil((favoriteAnimals?.favorites?.length ?? 0) / pageSize),
  };

  return (
    <>
      <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6 border-b border-gray-200 dark:border-gray-700">
        내가 찜한 동물
      </h2>

      <MyPageListState label="찜한 동물을" {...feedback}>
        {favoriteAnimals && favoriteAnimals.totalCount > 0 ? (
          <div className="mt-8 space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 {favoriteAnimals.totalCount}마리의 동물을 찜했습니다
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedFavoriteAnimals.items.map((favorite) => (
                <Link
                  key={favorite.favoriteId}
                  to={`/animals/${favorite.animalId}`}
                  className="block bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  {favorite.imageUrl ? (
                    <img src={favorite.imageUrl} alt={favorite.breed || '동물'} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-400">pets</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-text-main dark:text-white mb-2">{favorite.breed || '품종 정보 없음'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {favorite.species || '종 정보 없음'} • {favorite.gender || '성별 정보 없음'} • {favorite.age ? `${favorite.age}세` : '나이 정보 없음'}
                    </p>
                    {favorite.shelterName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {favorite.shelterName}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {paginatedFavoriteAnimals.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  이전
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: paginatedFavoriteAnimals.totalPages }, (_, i) => i).map((page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-brand text-brand-ink'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onPageChange(Math.min(paginatedFavoriteAnimals.totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= paginatedFavoriteAnimals.totalPages - 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">pets</span>
            <p className="text-gray-500 dark:text-gray-400">아직 찜한 동물이 없습니다.</p>
            <Link to="/animals" className="inline-block mt-4 px-6 py-2 bg-brand text-text-main rounded-lg hover:bg-brand-hover transition-colors">
              동물 둘러보기
            </Link>
          </div>
        )}
      </MyPageListState>
    </>
  );
}
