import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRegisteredAnimals } from '../api/user.api';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function RegisteredAnimals() {
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 등록한 동물 목록 조회 (페이징)
  const { data, isLoading } = useQuery({
    queryKey: ['registeredAnimals', currentPage, pageSize],
    queryFn: () => getRegisteredAnimals(currentPage, pageSize),
  });

  // 디버깅: 등록한 동물 목록 확인
  useEffect(() => {
    if (data) {
      console.log('=== RegisteredAnimals 페이지 응답 ===');
      console.log('전체 응답:', data);
      console.log('전체 개수:', data.content?.length || 0);
      console.log('각 동물의 apiSource:', data.content?.map((a) => ({ id: a.id, apiSource: a.apiSource, breed: a.breed })));
      const manualAnimals = data.content?.filter((animal) => animal.apiSource === 'MANUAL') || [];
      console.log('MANUAL 필터링 후 개수:', manualAnimals.length);
    }
  }, [data]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 서버가 MANUAL만 반환하는지 확인 필요
  // 현재는 프론트엔드에서 필터링 (서버가 모든 동물을 반환하는 경우 대비)
  const allAnimals = data?.content || [];
  // apiSource 필드가 없을 경우 apmsNoticeNo로 판단
  // MAN-으로 시작하면 수동 등록, 그 외는 APMS 동기화
  const animals = allAnimals.filter((animal) => {
    // apiSource가 있으면 그것을 우선 사용
    if (animal.apiSource) {
      return animal.apiSource === 'MANUAL';
    }
    // apiSource가 없으면 apmsNoticeNo로 판단
    return animal.apmsNoticeNo && animal.apmsNoticeNo.startsWith('MAN-');
  });
  const manualCount = animals.length;
  
  console.log('RegisteredAnimals - 필터링 전:', allAnimals.length, '개');
  console.log('RegisteredAnimals - 필터링 후:', animals.length, '개');
  console.log('RegisteredAnimals - 각 동물 정보:', allAnimals.map((a) => ({ 
    id: a.id, 
    apiSource: a.apiSource, 
    apmsNoticeNo: a.apmsNoticeNo,
    isManual: a.apiSource === 'MANUAL' || (a.apmsNoticeNo && a.apmsNoticeNo.startsWith('MAN-'))
  })));
  
  // 필터링된 결과를 기준으로 페이지네이션 계산
  // 실제 표시되는 동물 수를 기준으로 페이지 수 계산
  const actualTotalPages = Math.ceil(manualCount / pageSize);
  
  // 디버깅
  console.log('RegisteredAnimals - 필터링 후 동물 수:', manualCount);
  console.log('RegisteredAnimals - 계산된 totalPages:', actualTotalPages);
  console.log('RegisteredAnimals - 서버 totalPages:', data?.totalPages);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] mb-2">
            내 보호소가 등록한 동물
          </h1>
          <p className="text-subtext-light dark:text-gray-400 text-base">
            총 {manualCount}마리의 동물을 등록했습니다
          </p>
        </div>

        {animals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {animals.map((animal) => (
                <Link
                  key={animal.id}
                  to={`/animals/${animal.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  {/* 이미지 */}
                  {animal.imageUrl ? (
                    <div className="relative w-full h-56">
                      <img
                        src={animal.imageUrl}
                        alt={animal.breed || '동물'}
                        className="w-full h-full object-cover"
                      />
                      {/* 상태 + 성별 + 중성화 배지 */}
                      <div className="absolute top-3 right-3 flex items-center gap-2 flex-wrap justify-end">
                        {animal.status && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              animal.status === 'AVAILABLE' || animal.status === 'PROTECT'
                                ? 'bg-green-500 text-white'
                                : animal.status === 'ADOPTED'
                                ? 'bg-blue-500 text-white'
                                : animal.status === 'RESERVED' || animal.status === 'ADOPTION_PENDING'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}
                          >
                            {animal.status === 'AVAILABLE' || animal.status === 'PROTECT'
                              ? '보호중'
                              : animal.status === 'ADOPTED'
                              ? '입양완료'
                              : animal.status === 'RESERVED' || animal.status === 'ADOPTION_PENDING'
                              ? '입양대기'
                              : animal.status}
                          </span>
                        )}
                        {animal.gender === 'MALE' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            수컷
                          </span>
                        )}
                        {animal.gender === 'FEMALE' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400">
                            암컷
                          </span>
                        )}
                        {(!animal.gender || (animal.gender as string) === 'UNKNOWN') && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            미상
                          </span>
                        )}
                        {(animal.neuterStatus === 'YES' || animal.neutered === true) && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            중성화 완료
                          </span>
                        )}
                        {(animal.neuterStatus === 'NO' || animal.neutered === false) && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            중성화 미완료
                          </span>
                        )}
                        {animal.neuterStatus === 'UNKNOWN' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            중성화 미상
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-gray-400">pets</span>
                    </div>
                  )}

                  {/* 정보 */}
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-text-main dark:text-white mb-3 line-clamp-1">
                      {animal.breed || '품종 정보 없음'}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">category</span>
                        <span>{animal.species || '종 정보 없음'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          {animal.gender === 'MALE' ? 'male' :
                           animal.gender === 'FEMALE' ? 'female' :
                           animal.gender === 'NEUTERED' ? 'transgender' : 'help'}
                        </span>
                        <span>
                          {animal.gender === 'MALE' ? '수컷' :
                           animal.gender === 'FEMALE' ? '암컷' :
                           animal.gender === 'NEUTERED' ? '중성화' : '성별 정보 없음'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">cake</span>
                        <span>{animal.age ? `${animal.age}세` : animal.birthYear ? `${animal.birthYear}년생` : '나이 정보 없음'}</span>
                      </div>

                      {animal.apmsNoticeNo && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">tag</span>
                          <span className="line-clamp-1 text-xs">{animal.apmsNoticeNo}</span>
                        </div>
                      )}

                      {animal.favoriteCount !== undefined && animal.favoriteCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-red-500">favorite</span>
                          <span>{animal.favoriteCount}명이 찜했습니다</span>
                        </div>
                      )}
                    </div>

                    {animal.createdAt && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          등록일: {new Date(animal.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* 페이지네이션 */}
            {actualTotalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-text-main dark:text-white border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(actualTotalPages, 10) }, (_, i) => {
                    const pageNum = i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-text-main border-primary font-bold'
                            : 'bg-white dark:bg-gray-800 text-text-main dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= actualTotalPages - 1}
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-text-main dark:text-white border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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
        )}
      </main>

      <Footer />
    </div>
  );
}
