import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnimals } from '../api/animals.api';
import { getMockAnimals, calculateDday } from '../api/animals.api.mock';
import SearchBar from '../components/common/SearchBar';
import AnimalFilters from '../components/common/AnimalFilters';
import AnimalCard from '../components/common/AnimalCard';

// 개발 환경에서는 Mock 데이터 사용
const USE_MOCK_DATA = true; // 백엔드 연동 시 false로 변경

export default function Animals() {
  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState('');
  
  // 필터 상태 (기본 정렬: 공고 종료 임박)
  const [filters, setFilters] = useState({
    species: '',
    gender: '',
    status: '',
    region: '',
    sortBy: 'urgent',
  });

  // 데이터 가져오기 (Mock 또는 실제 API)
  const { data: animals, isLoading, error } = useQuery({
    queryKey: ['animals'],
    queryFn: USE_MOCK_DATA ? getMockAnimals : getAnimals,
  });

  // 필터 변경 핸들러
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 검색 핸들러
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 찜하기 핸들러 (나중에 API 연동)
  const handleFavorite = (id: number) => {
    console.log('찜하기:', id);
    // TODO: API 연동
  };

  // 필터링 및 정렬 로직
  const filteredAnimals = useMemo(() => {
    if (!animals) return [];

    let result = [...animals];

    // 검색 필터
    if (searchQuery) {
      result = result.filter((animal) =>
        animal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 종류 필터
    if (filters.species) {
      result = result.filter((animal) => animal.species === filters.species);
    }

    // 성별 필터
    if (filters.gender) {
      result = result.filter((animal) => animal.gender === filters.gender);
    }

    // 입양 상태 필터
    if (filters.status) {
      result = result.filter((animal) => animal.status === filters.status);
    }

    // 지역 필터
    if (filters.region) {
      result = result.filter((animal) => animal.region === filters.region);
    }

    // 정렬
    switch (filters.sortBy) {
      case 'urgent':
        // 공고 종료 임박순 (D-day가 작을수록 먼저)
        result.sort((a, b) => {
          const ddayA = a.noticeEndDate ? calculateDday(a.noticeEndDate) : 999;
          const ddayB = b.noticeEndDate ? calculateDday(b.noticeEndDate) : 999;
          return ddayA - ddayB;
        });
        break;
      case 'latest':
        // 최신순 (ID 역순)
        result.sort((a, b) => b.id - a.id);
        break;
      case 'name':
        // 이름순
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'age':
        // 나이순
        result.sort((a, b) => a.age - b.age);
        break;
    }

    return result;
  }, [animals, searchQuery, filters]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                🐾
              </div>
            </div>
            <p className="mt-8 text-xl text-gray-600 font-semibold animate-pulse">
              동물 친구들을 불러오고 있어요...
            </p>
            <p className="mt-2 text-sm text-gray-500">
              잠시만 기다려주세요 💙
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center transform hover:scale-105 transition-transform">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                에러가 발생했습니다
              </h2>
              <p className="text-gray-600 mb-6">
                {error instanceof Error ? error.message : '알 수 없는 에러'}
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>해결 방법:</strong> 백엔드 서버가 실행 중인지 확인해주세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800 mb-3 animate-fade-in">
            🐾 새 가족을 찾아요
          </h1>
          <p className="text-lg text-gray-600">
            소중한 인연을 기다리는 동물 친구들입니다
          </p>
        </div>

        {/* 검색바 */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="동물 이름으로 검색해보세요..."
          />
        </div>

        {/* 레이아웃: 필터(좌측) + 목록(우측) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 필터 영역 */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-4">
              <AnimalFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* 동물 목록 영역 */}
          <main className="flex-1 min-w-0">
            {/* 결과 요약 */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                총 <span className="font-bold text-blue-600 text-lg">{filteredAnimals.length}마리</span>의
                동물 친구를 찾았습니다
              </p>
              {searchQuery && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>검색:</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                    {searchQuery}
                  </span>
                </div>
              )}
            </div>

            {/* 동물 카드 그리드 */}
            {filteredAnimals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-16 text-center transform hover:scale-105 transition-transform">
                <div className="text-7xl mb-6 animate-bounce">😢</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  다른 검색어나 필터를 시도해보세요
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleFilterChange('species', '');
                    handleFilterChange('gender', '');
                    handleFilterChange('status', '');
                    handleFilterChange('region', '');
                  }}
                  className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                {filteredAnimals.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
