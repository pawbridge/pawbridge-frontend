import { useState, useEffect } from 'react';
import type { AnimalSearchParams } from '../../types/api.types';

interface AnimalFilterSidebarProps {
  filters: AnimalSearchParams;
  onFilterChange: (filters: AnimalSearchParams) => void;
  onReset: () => void;
}

export default function AnimalFilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: AnimalFilterSidebarProps) {
  // 로컬 상태 (입력 중인 값 저장)
  const [localFilters, setLocalFilters] = useState<AnimalSearchParams>(filters);

  // 외부 filters가 변경되면 로컬 상태도 업데이트 (초기화 등)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 텍스트 입력 (로컬 상태만 변경)
  const handleTextChange = (key: keyof AnimalSearchParams, value: string) => {
    setLocalFilters({
      ...localFilters,
      [key]: value || undefined,
    });
  };

  // 엔터키로 검색 실행
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFilterChange(localFilters);
    }
  };

  // 즉시 검색 (셀렉트, 숫자 입력용)
  const handleImmediateChange = (key: keyof AnimalSearchParams, value: string | number | undefined) => {
    const newFilters = {
      ...localFilters,
      [key]: value || undefined,
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // 검색 버튼 클릭
  const handleSearch = () => {
    onFilterChange(localFilters);
  };

  return (
    <div className="sticky top-24 space-y-6">
      <h3 className="text-lg font-bold tracking-[-0.015em] text-text-light dark:text-text-dark">
        상세 검색
      </h3>

      <div className="space-y-4">
        {/* 축종 */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">축종</p>
          <select
            value={localFilters.species || ''}
            onChange={(e) => handleImmediateChange('species', e.target.value)}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          >
            <option value="">전체</option>
            <option value="DOG">개</option>
            <option value="CAT">고양이</option>
            <option value="ETC">기타</option>
          </select>
        </label>

        {/* 품종 */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">품종</p>
          <input
            type="text"
            value={localFilters.breed || ''}
            onChange={(e) => handleTextChange('breed', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="예: 믹스견 (엔터로 검색)"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          />
        </label>

        {/* 공고 상태 */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">공고 상태</p>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleImmediateChange('status', e.target.value)}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          >
            <option value="">전체</option>
            <option value="PROTECT">보호중</option>
            <option value="ADOPTION_PENDING">입양대기중</option>
            <option value="ADOPTED">종료(입양)</option>
            <option value="EUTHANIZED">종료(안락사)</option>
            <option value="NATURAL_DEATH">종료(자연사)</option>
            <option value="RETURNED">종료(반환)</option>
            <option value="DONATED">종료(기증)</option>
            <option value="RELEASED">종료(방사)</option>
            <option value="ESCAPED">탈출</option>
            <option value="UNKNOWN">미상</option>
          </select>
        </label>

        {/* 나이 범위 */}
        <div>
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">나이 범위</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col w-full">
              <input
                type="number"
                value={localFilters.minAge || ''}
                onChange={(e) => handleImmediateChange('minAge', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="최소 (예: 1)"
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
              />
            </label>
            <label className="flex flex-col w-full">
              <input
                type="number"
                value={localFilters.maxAge || ''}
                onChange={(e) => handleImmediateChange('maxAge', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="최대 (예: 5)"
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            ※ 최소 나이를 설정하지 않으면 연령 미상 동물도 포함됩니다
          </p>
        </div>

        {/* 보호소 위치 (시/도) */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">보호소 위치 (시/도)</p>
          <select
            value={localFilters.region || ''}
            onChange={(e) => handleImmediateChange('region', e.target.value)}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          >
            <option value="">전체</option>
            <option value="서울">서울특별시</option>
            <option value="부산">부산광역시</option>
            <option value="대구">대구광역시</option>
            <option value="인천">인천광역시</option>
            <option value="광주">광주광역시</option>
            <option value="대전">대전광역시</option>
            <option value="울산">울산광역시</option>
            <option value="세종">세종특별자치시</option>
            <option value="경기">경기도</option>
            <option value="강원">강원도</option>
            <option value="충북">충청북도</option>
            <option value="충남">충청남도</option>
            <option value="전북">전라북도</option>
            <option value="전남">전라남도</option>
            <option value="경북">경상북도</option>
            <option value="경남">경상남도</option>
            <option value="제주">제주특별자치도</option>
          </select>
        </label>

        {/* 보호소 위치 (시/군/구) */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">보호소 위치 (시/군/구)</p>
          <input
            type="text"
            value={localFilters.city || ''}
            onChange={(e) => handleTextChange('city', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="예: 강남구 (엔터로 검색)"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          />
        </label>

        {/* 성별 */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">성별</p>
          <select
            value={filters.gender || ''}
            onChange={(e) => handleImmediateChange('gender', e.target.value)}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          >
            <option value="">전체</option>
            <option value="MALE">수컷</option>
            <option value="FEMALE">암컷</option>
            <option value="UNKNOWN">미상</option>
          </select>
        </label>

        {/* 중성화 여부 */}
        <div>
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">중성화 여부</p>
          <select
            value={filters.neuterStatus || ''}
            onChange={(e) => handleImmediateChange('neuterStatus', e.target.value)}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          >
            <option value="">전체</option>
            <option value="YES">예</option>
            <option value="NO">아니오</option>
            <option value="UNKNOWN">미상</option>
          </select>
        </div>

        {/* 통합 검색어 */}
        <label className="flex flex-col w-full">
          <p className="text-base font-medium pb-2 text-text-light dark:text-text-dark">통합 검색어</p>
          <input
            type="text"
            value={localFilters.keyword || ''}
            onChange={(e) => handleTextChange('keyword', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="품종, 특징, 발견 장소 (엔터로 검색)"
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary/50 h-14 placeholder:text-gray-400 p-[15px] text-base font-normal"
          />
        </label>
      </div>

      {/* 버튼 */}
      <div className="flex flex-col gap-2 pt-4">
        <button
          onClick={handleSearch}
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-primary text-white hover:bg-primary/90 text-base font-bold transition-colors shadow-md"
        >
          <span className="material-symbols-outlined mr-2">search</span>
          <span>검색</span>
        </button>
        <button
          onClick={onReset}
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-4 bg-transparent text-text-light dark:text-text-dark border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5 text-base font-medium transition-colors"
        >
          <span>초기화</span>
        </button>
      </div>
    </div>
  );
}


