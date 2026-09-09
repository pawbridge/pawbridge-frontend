import { useState } from 'react';

interface AnimalFiltersProps {
  filters: {
    species: string;
    gender: string;
    status: string;
    region: string;
    sortBy: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function AnimalFilters({ filters, onFilterChange }: AnimalFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  // 활성화된 필터 개수 계산
  const activeFilterCount = Object.values(filters).filter(
    (value, index) => value !== '' && index !== 4 // sortBy 제외
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* 헤더 (모바일에서 토글 가능) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors lg:cursor-default"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="text-lg font-bold text-gray-800">필터</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform lg:hidden ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 필터 내용 */}
      <div
        className={`transition-all duration-300 ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[2000px] lg:opacity-100'
        }`}
      >
        <div className="px-6 pb-6 space-y-6">
          {/* 정렬 (맨 위로 이동 - 가장 중요) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              정렬
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-medium"
            >
              <option value="urgent">🔥 공고 종료 임박</option>
              <option value="latest">⏰ 최신순</option>
              <option value="name">📝 이름순</option>
              <option value="age">🎂 나이순</option>
            </select>
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              지역
            </label>
            <select
              value={filters.region}
              onChange={(e) => onFilterChange('region', e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">전체 지역</option>
              <option value="서울">서울</option>
              <option value="부산">부산</option>
              <option value="대구">대구</option>
              <option value="인천">인천</option>
              <option value="광주">광주</option>
              <option value="대전">대전</option>
              <option value="울산">울산</option>
              <option value="세종">세종</option>
              <option value="경기">경기</option>
              <option value="강원">강원</option>
              <option value="충북">충북</option>
              <option value="충남">충남</option>
              <option value="전북">전북</option>
              <option value="전남">전남</option>
              <option value="경북">경북</option>
              <option value="경남">경남</option>
              <option value="제주">제주</option>
            </select>
          </div>

          {/* 종류 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              종류
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="전체"
                active={filters.species === ''}
                onClick={() => onFilterChange('species', '')}
              />
              <FilterButton
                label="🐕 강아지"
                active={filters.species === '강아지'}
                onClick={() => onFilterChange('species', '강아지')}
              />
              <FilterButton
                label="🐈 고양이"
                active={filters.species === '고양이'}
                onClick={() => onFilterChange('species', '고양이')}
              />
            </div>
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              성별
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="전체"
                active={filters.gender === ''}
                onClick={() => onFilterChange('gender', '')}
              />
              <FilterButton
                label="♂ 수컷"
                active={filters.gender === 'MALE'}
                onClick={() => onFilterChange('gender', 'MALE')}
              />
              <FilterButton
                label="♀ 암컷"
                active={filters.gender === 'FEMALE'}
                onClick={() => onFilterChange('gender', 'FEMALE')}
              />
            </div>
          </div>

          {/* 입양 상태 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              입양 상태
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="전체"
                active={filters.status === ''}
                onClick={() => onFilterChange('status', '')}
              />
              <FilterButton
                label="✅ 입양 가능"
                active={filters.status === 'AVAILABLE'}
                onClick={() => onFilterChange('status', 'AVAILABLE')}
              />
              <FilterButton
                label="💝 입양 완료"
                active={filters.status === 'ADOPTED'}
                onClick={() => onFilterChange('status', 'ADOPTED')}
              />
            </div>
          </div>

          {/* 필터 초기화 버튼 */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                onFilterChange('species', '');
                onFilterChange('gender', '');
                onFilterChange('status', '');
                onFilterChange('region', '');
              }}
              className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 필터 버튼 컴포넌트
interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ label, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-blue-500 text-white shadow-md scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
      }`}
    >
      {label}
    </button>
  );
}
