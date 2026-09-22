import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Animal } from '../../types/api.types';

interface AnimalSearchCardProps {
  animal: Animal;
  searchReturnTo: string;
}

const statusLabels: Record<string, string> = {
  PROTECT: '보호중', ADOPTION_PENDING: '입양대기중', ADOPTED: '종료(입양)', EUTHANIZED: '종료(안락사)',
  NATURAL_DEATH: '종료(자연사)', RETURNED: '종료(반환)', DONATED: '종료(기증)', RELEASED: '종료(방사)', ESCAPED: '탈출', UNKNOWN: '미상',
};

function dday(endDate?: string): string | null {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return null;
  return days === 0 ? 'D-DAY' : `D-${days}`;
}

function dateLabel(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replace(/\. /g, '.').replace(/\.$/, '');
}

function genderLabel(gender?: string): string {
  if (gender === 'MALE') return '수컷';
  if (gender === 'FEMALE') return '암컷';
  return '성별 미상';
}

function neuterLabel(animal: Animal): string | null {
  if (animal.neuterStatus === 'YES' || animal.neutered === true) return '중성화 완료';
  if (animal.neuterStatus === 'NO' || animal.neutered === false) return '중성화 안 됨';
  return null;
}

export default function AnimalSearchCard({ animal, searchReturnTo }: AnimalSearchCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const noticeNumber = animal.apmsNoticeNo || animal.noticeNo;
  const shelterName = animal.shelter?.name || animal.shelterName;
  const foundDate = dateLabel(animal.happenDate || animal.noticeStartDate);
  const birth = animal.birthYear ? `${animal.birthYear}년생` : animal.age !== undefined ? `${animal.age}살` : '연령 미상';
  const weight = animal.weight ? `${animal.weight}kg` : null;
  const neuter = neuterLabel(animal);
  const feature = animal.specialMark || animal.description;
  const deadline = dday(animal.noticeEndDate);

  return (
    <Link
      to={`/animals/${animal.id}`}
      state={{ searchReturnTo }}
      className="group relative grid min-h-[236px] grid-cols-[112px_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl border border-brand-border bg-white dark:bg-card-dark p-3 transition-colors hover:border-brand-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-focus md:grid-cols-[220px_minmax(0,1fr)] md:gap-5 md:p-4"
      aria-label={`${animal.breed || '품종 미상'} 상세 보기`}
    >
      <div className="h-[150px] overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800 md:h-[220px]">
        {animal.imageUrl && !imageFailed ? (
          <img src={animal.imageUrl} alt={`${animal.breed || '동물'} 사진`} loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs font-medium text-brand-muted dark:text-gray-300">등록된 사진이 없습니다</div>
        )}
      </div>

      <div className="min-w-0 py-0.5">
        <div className="flex flex-wrap items-center gap-2 pr-0 md:pr-20">
          <span className="rounded-full bg-[#ddefe9] px-3 py-1 text-xs font-medium text-[#02542d]">{statusLabels[animal.status] || animal.status}</span>
          {deadline && <span className="rounded-full bg-[#fffbeb] px-3 py-1 text-xs font-bold text-[#b45309]">{deadline}</span>}
        </div>
        <span className="mt-3 hidden text-xs font-bold text-brand-accent md:absolute md:right-4 md:top-4 md:block">상세 보기</span>
        <h2 className="mt-3 truncate text-lg font-bold text-brand-ink dark:text-text-dark md:text-xl">{animal.breed || '품종 정보 없음'}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted dark:text-gray-300">{[genderLabel(animal.gender), birth, weight, neuter].filter(Boolean).join(', ')}</p>
        {animal.color && <p className="mt-1 line-clamp-1 text-xs text-brand-muted dark:text-gray-300"><span className="font-medium text-brand-ink dark:text-text-dark">색상</span> {animal.color}</p>}
        {feature && <p className="mt-2 line-clamp-2 rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-bold leading-5 text-brand-ink dark:text-text-dark">{feature}</p>}
        <div className="mt-2 space-y-1 text-[11px] leading-4 text-brand-muted dark:text-gray-300 md:mt-3 md:text-xs">
          {(foundDate || animal.happenPlace || animal.foundPlace) && <p className="line-clamp-1"><span className="font-medium text-brand-ink dark:text-text-dark">발견</span> {[foundDate, animal.happenPlace || animal.foundPlace].filter(Boolean).join(', ')}</p>}
          {shelterName && <p className="truncate"><span className="font-medium text-brand-ink dark:text-text-dark">보호소</span> {shelterName}</p>}
          {noticeNumber && <p className="truncate"><span className="font-medium text-brand-ink dark:text-text-dark">공고번호</span> {noticeNumber}</p>}
        </div>
        <span className="mt-2 inline-block text-xs font-bold text-brand-accent md:hidden">상세 보기</span>
      </div>
    </Link>
  );
}
