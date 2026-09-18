import { useEffect, useState, type ReactNode } from 'react';
import type { AnimalSearchParams } from '../../types/api.types';
import { defaultAnimalSearch } from '../../utils/animalSearch';
import { animalRegions } from '../../utils/animalRegions';

type SearchMode = 'feature' | 'notice';
type Picker = 'breed' | 'region' | null;

interface AnimalSearchFiltersProps {
  filters: AnimalSearchParams;
  onApply: (filters: AnimalSearchParams) => void;
  onReset: () => void;
}

const fieldClass = 'h-12 w-full rounded-xl border border-[#c7ced1] bg-white px-4 text-sm text-[#052e16] placeholder:text-[#6e7a75] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const chipClass = 'inline-flex min-h-9 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function selectedSummary(filters: AnimalSearchParams): string[] {
  const values: string[] = [];
  if (filters.species) values.push(filters.species === 'DOG' ? '개' : filters.species === 'CAT' ? '고양이' : '기타 동물');
  if (filters.breed) values.push(filters.breed);
  if (filters.region) values.push([filters.region, filters.city].filter(Boolean).join(' '));
  if (filters.status === 'PROTECT') values.push('보호중');
  if (filters.gender) values.push(filters.gender === 'MALE' ? '수컷' : filters.gender === 'FEMALE' ? '암컷' : '성별 미상');
  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    values.push(`${filters.minAge ?? 0}~${filters.maxAge ?? '전체'}살`);
  }
  return values;
}

export default function AnimalSearchFilters({ filters, onApply, onReset }: AnimalSearchFiltersProps) {
  const [mode, setMode] = useState<SearchMode>(filters.noticeNo ? 'notice' : 'feature');
  const [searchText, setSearchText] = useState(filters.noticeNo || filters.keyword || '');
  const [picker, setPicker] = useState<Picker>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [breedDraft, setBreedDraft] = useState(filters.breed || '');
  const [selectedRegion, setSelectedRegion] = useState(filters.region || '');
  const [selectedCity, setSelectedCity] = useState(filters.city || '');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMode(filters.noticeNo ? 'notice' : 'feature');
    setSearchText(filters.noticeNo || filters.keyword || '');
    setBreedDraft(filters.breed || '');
    setSelectedRegion(filters.region || '');
    setSelectedCity(filters.city || '');
  }, [filters]);

  const summary = selectedSummary(filters);
  const activeRegion = animalRegions.find((region) => region.value === selectedRegion);

  const submitSearch = () => {
    const value = searchText.trim();
    if (mode === 'notice' && !value) return;
    const baseFilters = filters.noticeNo && mode === 'feature' ? defaultAnimalSearch : filters;
    onApply({
      ...baseFilters,
      keyword: mode === 'feature' ? value || undefined : undefined,
      noticeNo: mode === 'notice' ? value || undefined : undefined,
    });
  };

  const changeMode = (nextMode: SearchMode) => {
    setMode(nextMode);
    setSearchText(nextMode === 'feature' ? filters.keyword || '' : filters.noticeNo || '');
  };

  const openPicker = (nextPicker: Exclude<Picker, null>) => {
    if (nextPicker === 'breed') {
      setBreedDraft(filters.breed || '');
    } else {
      setPickerQuery('');
    }
    setPicker(nextPicker);
  };

  const applyBreed = () => {
    const breed = breedDraft.trim();
    onApply({ ...filters, breed: breed || undefined });
    setPicker(null);
  };

  const applyRegion = () => {
    onApply({ ...filters, region: selectedRegion || undefined, city: selectedCity || undefined });
    setPicker(null);
  };

  const resetPicker = () => {
    if (picker === 'breed') {
      setBreedDraft('');
      return;
    }
    setSelectedRegion('');
    setSelectedCity('');
  };

  return (
    <section aria-label="동물 검색 조건" className="space-y-5">
      <div className="flex gap-1 rounded-2xl bg-[#f6f9f7] p-2">
        {([['feature', '특징으로 찾기'], ['notice', '공고번호 조회']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeMode(value)}
            className={`min-h-10 rounded-full px-5 text-sm font-medium transition-colors ${mode === value ? 'bg-[#ddefe9] text-[#036b3c]' : 'bg-white text-[#4b575c] hover:text-[#052e16]'}`}
            aria-pressed={mode === value}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="animal-main-search">{mode === 'feature' ? '동물 특징 검색' : '공고번호 검색'}</label>
        <input
          id="animal-main-search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
          placeholder={mode === 'feature' ? '예: 검은 털, 흰 가슴 무늬, 파란 목줄, 수원역 근처' : '공고번호를 정확히 입력하세요'}
          className={`${fieldClass} flex-1`}
        />
        <button type="button" onClick={submitSearch} className="h-12 rounded-2xl bg-primary px-8 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          검색
        </button>
      </div>

      {mode === 'feature' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold text-[#6e7a75]">검색 예시</span>
          {['갈색 털, 빨간 목줄', '한쪽 귀가 접힘', '코 주변 흰 무늬'].map((example) => (
            <button key={example} type="button" onClick={() => { setSearchText(example); onApply({ ...(filters.noticeNo ? defaultAnimalSearch : filters), keyword: example, noticeNo: undefined }); }} className={`${chipClass} border-[#c7ced1] bg-white text-[#052e16] hover:border-primary`}>
              {example}
            </button>
          ))}
        </div>
      )}

      {mode === 'notice' ? (
        <p className="rounded-xl bg-[#f6f9f7] px-4 py-3 text-xs leading-5 text-[#6e7a75]">
          공고번호는 다른 검색 조건과 관계없이 정확히 일치하는 공고를 조회합니다.
        </p>
      ) : (
      <div className="relative rounded-2xl bg-[#f6f9f7] px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold text-[#091f15]">검색 조건</span>
          <button type="button" onClick={() => onApply({ ...filters, species: undefined })} className={`${chipClass} ${!filters.species ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            {!filters.species && <span aria-hidden="true" className="mr-1">✓</span>}전체 동물
          </button>
          <button type="button" onClick={() => openPicker('breed')} className={`${chipClass} ${filters.breed ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            {filters.breed || '품종'}
          </button>
          <button type="button" onClick={() => openPicker('region')} className={`${chipClass} ${filters.region ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            {filters.city || filters.region || '지역'}
          </button>
          <button type="button" onClick={() => onApply({ ...filters, status: filters.status === 'PROTECT' ? undefined : 'PROTECT' })} className={`${chipClass} ${filters.status === 'PROTECT' ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            {filters.status === 'PROTECT' && <span aria-hidden="true" className="mr-1">✓</span>}보호중
          </button>
          <button type="button" onClick={() => setDetailsOpen(true)} className={`${chipClass} ${filters.gender ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            {filters.gender === 'MALE' ? '수컷' : filters.gender === 'FEMALE' ? '암컷' : filters.gender === 'UNKNOWN' ? '성별 미상' : '성별'}
          </button>
          <button type="button" onClick={() => setDetailsOpen(true)} className={`${chipClass} ${filters.minAge !== undefined || filters.maxAge !== undefined ? 'border-primary bg-primary text-white' : 'border-[#c7ced1] bg-white text-[#052e16]'}`}>
            나이
          </button>
          <button type="button" onClick={() => setDetailsOpen((open) => !open)} className={`${chipClass} ml-0 border-[#c7ced1] bg-white text-[#052e16] md:ml-auto`} aria-expanded={detailsOpen}>
            상세 필터
          </button>
        </div>

        <div className="mt-3 flex min-h-5 items-start justify-between gap-4 text-xs">
          <p className="text-[#6e7a75]">선택된 조건 <strong className="ml-2 text-[#036b3c]">{summary.length ? summary.join(', ') : '없음'}</strong></p>
          <button type="button" onClick={onReset} className="shrink-0 text-[#6e7a75] underline-offset-4 hover:text-[#052e16] hover:underline">조건 초기화</button>
        </div>

        {detailsOpen && (
          <div className="mt-4 grid gap-4 border-t border-[#dee5e3] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-bold text-[#4b575c]">동물 종류
              <select value={filters.species || ''} onChange={(event) => onApply({ ...filters, species: event.target.value || undefined, breed: undefined })} className={`${fieldClass} mt-2`}>
                <option value="">전체 동물</option><option value="DOG">개</option><option value="CAT">고양이</option><option value="ETC">기타 동물</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#4b575c]">성별
              <select value={filters.gender || ''} onChange={(event) => onApply({ ...filters, gender: (event.target.value || undefined) as AnimalSearchParams['gender'] })} className={`${fieldClass} mt-2`}>
                <option value="">전체</option><option value="MALE">수컷</option><option value="FEMALE">암컷</option><option value="UNKNOWN">성별 미상</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#4b575c]">최소 나이
              <input type="number" min="0" inputMode="numeric" value={filters.minAge ?? ''} onChange={(event) => onApply({ ...filters, minAge: event.target.value ? Number(event.target.value) : undefined })} className={`${fieldClass} mt-2`} />
            </label>
            <label className="text-xs font-bold text-[#4b575c]">최대 나이
              <input type="number" min="0" inputMode="numeric" value={filters.maxAge ?? ''} onChange={(event) => onApply({ ...filters, maxAge: event.target.value ? Number(event.target.value) : undefined })} className={`${fieldClass} mt-2`} />
            </label>
          </div>
        )}

        {picker && (
          <>
            <button type="button" aria-label="선택창 닫기" className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setPicker(null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="animal-picker-title" className={`fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-hidden rounded-t-2xl border border-[#c7ced1] bg-white shadow-2xl md:absolute md:bottom-auto md:left-24 md:top-14 md:max-h-none md:rounded-xl ${picker === 'breed' ? 'md:w-[400px]' : 'md:w-[520px]'}`}>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#c7ced1] md:hidden" />
              <div className="flex items-start justify-between px-5 pb-3 pt-4">
                <div><h3 id="animal-picker-title" className="text-lg font-bold text-[#052e16]">{picker === 'breed' ? '품종 입력' : '지역 선택'}</h3><p className="mt-1 text-xs text-[#6e7a75]">{picker === 'breed' ? '품종명을 직접 입력하세요. 일부만 입력해도 검색할 수 있습니다.' : '시·도와 시·군·구를 차례로 선택하세요.'}</p></div>
                <button type="button" onClick={() => setPicker(null)} className="flex size-11 items-center justify-center rounded-lg text-xl text-[#4b575c] hover:bg-[#f6f9f7]" aria-label="닫기">×</button>
              </div>
              <div className="px-5"><input value={picker === 'breed' ? breedDraft : pickerQuery} onChange={(event) => picker === 'breed' ? setBreedDraft(event.target.value) : setPickerQuery(event.target.value)} onKeyDown={(event) => { if (picker === 'breed' && event.key === 'Enter') applyBreed(); }} placeholder={picker === 'breed' ? '예: 말티즈, 믹스견' : '지역명 검색'} className={fieldClass} autoFocus /></div>

              {picker === 'region' && (
                <div className="grid max-h-[360px] grid-cols-1 overflow-y-auto px-5 py-3 md:grid-cols-2 md:gap-6">
                  <div className={`${selectedRegion ? 'hidden md:block' : ''} md:border-r md:border-[#dee5e3] md:pr-5`}>
                    <p className="mb-1 text-xs font-bold text-[#052e16]">시·도</p>
                    {animalRegions.filter((region) => !pickerQuery.trim() || `${region.label} ${region.cities.join(' ')}`.includes(pickerQuery.trim())).map((region) => (
                      <PickerOption key={region.value} selected={selectedRegion === region.value} onClick={() => { setSelectedRegion(region.value); setSelectedCity(''); }}>{region.label}</PickerOption>
                    ))}
                  </div>
                  <div className={`${selectedRegion ? 'block' : 'hidden'} md:block`}>
                    <p className="mb-1 text-xs font-bold text-[#052e16]">시·군·구</p>
                    {selectedRegion && <button type="button" onClick={() => { setSelectedRegion(''); setSelectedCity(''); }} className="mb-1 min-h-11 w-full border-b border-[#dee5e3] px-3 text-left text-sm font-bold text-[#2f7d68] md:hidden">‹ 시·도 다시 선택</button>}
                    {activeRegion ? activeRegion.cities.map((city) => <PickerOption key={city} selected={(city === '전체' && !selectedCity) || selectedCity === city} onClick={() => setSelectedCity(city === '전체' ? '' : city)}>{city === '전체' ? `${activeRegion.label} 전체` : city}</PickerOption>) : <p className="py-4 text-sm text-[#6e7a75]">시·도를 먼저 선택하세요.</p>}
                  </div>
                </div>
              )}

              <div className={`flex gap-3 p-4 ${picker === 'region' ? 'border-t border-[#dee5e3]' : 'pt-5'}`}>
                <button type="button" onClick={resetPicker} className="h-12 flex-1 rounded-2xl border border-[#c7ced1] text-sm font-medium text-[#2f7d68]">초기화</button>
                <button type="button" onClick={picker === 'breed' ? applyBreed : applyRegion} className="h-12 flex-1 rounded-2xl bg-primary text-sm font-bold text-white">적용</button>
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </section>
  );
}

function PickerOption({ children, selected, onClick }: { children: ReactNode; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-11 w-full items-center justify-between border-b border-[#dee5e3] px-3 text-left text-sm ${selected ? 'font-bold text-primary' : 'text-[#052e16] hover:bg-[#f6f9f7]'}`}><span>{children}</span>{selected && <span aria-hidden="true">✓</span>}</button>;
}
