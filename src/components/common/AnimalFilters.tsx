interface AnimalFiltersProps {
  filters: {
    species: string;
    gender: string;
    status: string;
    sortBy: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

export default function AnimalFilters({ filters, onFilterChange }: AnimalFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">필터</h3>
      
      <div className="space-y-4">
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
              label="수컷"
              active={filters.gender === 'MALE'}
              onClick={() => onFilterChange('gender', 'MALE')}
            />
            <FilterButton
              label="암컷"
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
              label="입양 가능"
              active={filters.status === 'AVAILABLE'}
              onClick={() => onFilterChange('status', 'AVAILABLE')}
            />
            <FilterButton
              label="입양 완료"
              active={filters.status === 'ADOPTED'}
              onClick={() => onFilterChange('status', 'ADOPTED')}
            />
          </div>
        </div>

        {/* 정렬 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            정렬
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="latest">최신순</option>
            <option value="name">이름순</option>
            <option value="age">나이순</option>
          </select>
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
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

