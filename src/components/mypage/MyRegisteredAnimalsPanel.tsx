import { Link } from 'react-router-dom';
import type { Animal, PageResponse } from '../../types/api.types';

interface MyRegisteredAnimalsPanelProps {
  registeredAnimals: PageResponse<Animal> | undefined;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function MyRegisteredAnimalsPanel({
  registeredAnimals,
  currentPage,
  onPageChange,
}: MyRegisteredAnimalsPanelProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-text-main dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
          내 보호소가 등록한 동물
        </h2>
        <Link
          to="/animals/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-ink rounded-lg hover:bg-brand-hover transition-colors font-bold text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          새 동물 등록
        </Link>
      </div>

      {registeredAnimals && registeredAnimals.content && registeredAnimals.content.length > 0 ? (
        (() => {
          const manualAnimals = registeredAnimals.content;
          return manualAnimals.length > 0 ? (
            <div className="mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                총 {registeredAnimals.totalElements}마리의 동물을 등록했습니다
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {manualAnimals.map((animal) => (
                  <Link
                    key={animal.id}
                    to={`/animals/${animal.id}`}
                    state={{ from: 'mypage', tab: 'registeredAnimals' }}
                    className="block bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                  >
                    {animal.imageUrl ? (
                      <img src={animal.imageUrl} alt={animal.breed || '동물'} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-gray-400">pets</span>
                      </div>
                    )}
                    <div className="p-4">
                      {/* 상태 + 성별 + 중성화 배지 */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {animal.status && (
                          <span className={`text-xs font-bold rounded-full px-2 py-1 ${
                            animal.status === 'PROTECT'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {animal.status === 'PROTECT' ? '보호중' : animal.status}
                          </span>
                        )}
                        {animal.gender === 'MALE' && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            수컷
                          </span>
                        )}
                        {animal.gender === 'FEMALE' && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400">
                            암컷
                          </span>
                        )}
                        {(!animal.gender || (animal.gender as string) === 'UNKNOWN') && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            미상
                          </span>
                        )}
                        {(animal.neuterStatus === 'YES' || animal.neutered === true) && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            중성화 완료
                          </span>
                        )}
                        {(animal.neuterStatus === 'NO' || animal.neutered === false) && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            중성화 미완료
                          </span>
                        )}
                        {animal.neuterStatus === 'UNKNOWN' && (
                          <span className="text-xs font-bold rounded-full px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            중성화 미상
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-text-main dark:text-white mb-2">{animal.breed || '품종 정보 없음'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {animal.species || '종 정보 없음'} • {animal.age ? `${animal.age}세` : '나이 정보 없음'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* 페이지네이션 */}
              {(() => {
                const totalPages = registeredAnimals.totalPages;
                const firstPage = Math.max(0, Math.min(currentPage - 1, totalPages - 3));

                return totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      이전
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => firstPage + i).map((page) => (
                        <button
                          key={page}
                          aria-current={currentPage === page ? 'page' : undefined}
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
                      onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      다음
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mt-8">
              <span className="material-symbols-outlined text-7xl text-gray-300 dark:text-gray-600 mb-4">
                pets
              </span>
              <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
                아직 등록한 동물이 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                보호소 계정으로 동물을 등록해보세요
              </p>
            </div>
          );
        })()
      ) : (
        <div className="mt-8 text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">pets</span>
          <p className="text-gray-500 dark:text-gray-400">아직 등록한 동물이 없습니다.</p>
        </div>
      )}
    </>
  );
}
