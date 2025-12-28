import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getFavoriteAnimals } from '../api/user.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function FavoriteAnimals() {
  // 찜한 동물 목록 조회
  const { data: favoriteAnimals, isLoading } = useQuery({
    queryKey: ['favoriteAnimals'],
    queryFn: getFavoriteAnimals,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] mb-2">
            내가 찜한 동물
          </h1>
          <p className="text-subtext-light dark:text-gray-400 text-base">
            {favoriteAnimals?.totalCount || 0}마리의 동물을 찜했습니다
          </p>
        </div>

        {favoriteAnimals && favoriteAnimals.totalCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteAnimals.favorites.map((favorite) => (
              <Link
                key={favorite.favoriteId}
                to={`/animals/${favorite.animalId}`}
                className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
              >
                {/* 이미지 */}
                {favorite.imageUrl ? (
                  <div className="relative w-full h-56">
                    <img
                      src={favorite.imageUrl}
                      alt={favorite.breed || '동물'}
                      className="w-full h-full object-cover"
                    />
                    {favorite.status === 'DELETED' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">삭제된 동물</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400">pets</span>
                  </div>
                )}

                {/* 정보 */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-text-main dark:text-white mb-3 line-clamp-1">
                    {favorite.breed || '품종 정보 없음'}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">category</span>
                      <span>{favorite.species || '종 정보 없음'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">
                        {favorite.gender === '수컷' || favorite.gender === 'M' ? 'male' :
                         favorite.gender === '암컷' || favorite.gender === 'F' ? 'female' : 'help'}
                      </span>
                      <span>{favorite.gender || '성별 정보 없음'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">cake</span>
                      <span>{favorite.age ? `${favorite.age}세` : '나이 정보 없음'}</span>
                    </div>

                    {favorite.shelterName && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span className="line-clamp-1">{favorite.shelterName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      찜한 날짜: {new Date(favorite.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
              pets
            </span>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
              아직 찜한 동물이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              보호소의 동물들을 둘러보고 관심있는 동물을 찜해보세요
            </p>
            <Link
              to="/animals"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-text-main rounded-lg font-bold hover:bg-green-400 transition-colors"
            >
              <span className="material-symbols-outlined">search</span>
              동물 둘러보기
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
